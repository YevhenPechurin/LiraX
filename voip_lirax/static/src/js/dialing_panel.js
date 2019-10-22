odoo.define('voip_lirax.dialingPanel', function (require) {
    "use strict";

    const WebClient = require('web.WebClient');
    const Widget = require('web.Widget');
    const core = require('web.core');
    const ajax = require('web.ajax');
    const _t = core._t;

    const Call = require('voip_lirax.call');


    const DialingPanel = Widget.extend({
        template: "voip_lirax.DialingPanel",
        events: {
            "mousemove": "_onMove",
            "mousedown .voip_top_panel": "_onMouseDownTopPanel",
            "mouseup .voip_top_panel": "_onMouseUpTopPanel",
            "mouseleave .voip_top_panel": "_onMouseUpTopPanel",
            "click .voip_panel_close": "_onClosePanel",
            "click .js_number_button": "_onClickNumberButton",
            "click .js_keypad_clear": "_onClickInputClear",
            "click .js_keypad_backspace": "_onClickBackspace",
            "click .js_make_call": "_onClickMakeCall",
            "click .js_hangup": "_onClickHangup",
            "click .o_dtmf": "_onClickDTMF",
        },
        init() {
            this._super(...arguments);
            this._isShow = false;
            this._isDTMF = false;
            this._pos1 = 0;
            this._pos2 = 0;
            this._pos3 = 0;
            this._pos4 = 0;
            this.onmouseup = null;
            this.onmousemove = null;
            this.calls = [];
            this.lines = [];
        },
        /**
         * @override
         */
        start() {
            this.el.style.left = this.el.parentElement.offsetWidth / 2 - this.el.offsetWidth / 2 + "px";
            this.el.style.top = this.el.parentElement.offsetHeight / 2 - this.el.offsetHeight / 2 + "px";
            this.$el.hide();
            this._$numberInput = this.$('.js_keypad_input');
            this._$dialPanel = this.$('.voip_panel_keypad');
            this._$dtmfButton = this.$('.o_dtmf');
            this._blockOverlay('Connection...');
            this._initPhone();

            core.bus.on('voip_onTogglePanel', this, this._onTogglePanel);
        },

        /**
         * @private
         */
        async _togglePanel() {
            if (this._isShow) {
                this.$el.hide();
                this._isShow = false;
            } else {
                this.$el.show();
                this._isShow = true;
            }
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * Toggle panel.
         *
         * @private
         * @return {Promise}
         */
        async _onTogglePanel() {
            await this._togglePanel();
        },
        /**
         * Mouse Down on top panel.
         *
         * @private
         * @param {MouseEvent} ev
         */
        _onMouseDownTopPanel(ev) {
            this._pos3 = ev.clientX;
            this._pos4 = ev.clientY;
            this.onmouseup = true;
            this.onmousemove = true;
        },
        /**
         * Mouse Up on top panel.
         *
         * @private
         */
        _onMouseUpTopPanel() {
            this.onmouseup = false;
            this.onmousemove = false;
        },
        /**
         * Mouse move panel.
         *
         * @private
         * @param {MouseEvent} ev
         */
        _onMove(ev) {
            if (this.onmouseup) {
                ev.preventDefault();
                this._pos1 = this._pos3 - ev.clientX;
                this._pos2 = this._pos4 - ev.clientY;
                this._pos3 = ev.clientX;
                this._pos4 = ev.clientY;
                // set the element's new position:
                let top = this.el.offsetTop - this._pos2;
                let left = this.el.offsetLeft - this._pos1;
                if (top > 0 && left > 0 && top + this.el.offsetHeight < this.el.parentElement.offsetHeight && left + this.el.offsetWidth < this.el.parentElement.offsetWidth) {
                    this.el.style.top = (this.el.offsetTop - this._pos2) + "px";
                    this.el.style.left = (this.el.offsetLeft - this._pos1) + "px";
                }
            }
        },
        /**
         * Close panel.
         *
         * @private
         * @param {MouseEvent} e
         */
        _onClosePanel(e) {
            e.preventDefault();
            this.$el.hide();
            this._isShow = false;
        },
        /**
         * Clock number.
         *
         * @private
         * @param {MouseEvent} e
         */
        _onClickNumberButton(e) {
            e.preventDefault();
            let number = e.currentTarget.textContent;
            if (this.isCall && this._isDTMF) {
                this.calls.find(call => call.hold === false).forEach(call => this.phone.sendDTMF(call.line, number))
            } else {
                let val = this._$numberInput.val();
                this._$numberInput.val(val + number);
            }
        },
        _onClickInputClear() {
            this._$numberInput.val('');
        },
        _onClickBackspace() {
            this._$numberInput.val(this._$numberInput.val().slice(0, -1));
        },
        async _onClickMakeCall() {
            let incomingCalls = await this.calls.find(call => call.phonecall.type === this.phone.INCOMING);
            if (incomingCalls !== undefined) {
                if (Array.isArray(incomingCalls)) {
                    incomingCalls.forEach(call => this.phone.acceptCall(call.phonecall.line))
                } else {
                    this.phone.acceptCall(incomingCalls.line)
                }
            } else if (this._$numberInput.val()) {
                this._makeCall(this._$numberInput.val())
            }
        },
        _onClickHangup() {
            if (this.isCall) {
                this.calls.forEach(call => this._HangupCall(call.line));
            }
        },
        _makeCall(number) {
            if (!this.isCall) {
                this.phone.makeCall(number);
            } else {
                this.calls.forEach(call => call._holdCall());
                this.phone.makeCall(number);
            }
        },
        _HangupCall(line) {
            this.phone.finishCall(line);
        },
        async _onCreateCall(call) {
            let data = await this._rpc({
                model: 'voip_lirax.phonecall',
                method: 'create_call',
                args: [call.phoneNumber, call.type === this.phone.INCOMING],
            });
            let newCall = new Call(this, call, data);
            newCall.appendTo(this.$('.o_call'));
            this.calls.push(newCall);
        },
        async _onConnectCall(call) {
            let $call = await this._getCall(call);
            await $call.startTimer();
            this.isCall = true;
        },
        async _onDestroy(call) {
            this._removeCall(call).then(() => {
                if (this.calls.length === 0) {
                    this.isCall = false;
                }
            })
        },
        _toggleDtmfButtonDisabled() {
            this._$dtmfButton.addClass('o_dtmf_disabled');
            this._$dtmfButton.removeClass('o_dtmf_enabled');
        },
        _toggleDtmfButtonEnabled() {
            this._$dtmfButton.addClass('o_dtmf_enabled');
            this._$dtmfButton.removeClass('o_dtmf_disabled');
        },
        _onClickDTMF() {
            if (this._isDTMF) {
                this._toggleDtmfButtonDisabled();
                this._isDTMF = false;
            } else {
                this._toggleDtmfButtonEnabled();
                this._isDTMF = true;
            }
        },
        async _removeCall(call) {
            let rcall = await this._getCall(call);
            rcall.destroyCall();
            this.calls.splice(this.calls.findIndex(phonecall => phonecall.line === call.line), 1);
        },
        _getCall(call) {
            return this.calls.find(phonecall => phonecall.line === call.line);
        },
        _blockOverlay(message) {
            this._$dialPanel.block({message: message});
        },
        _unblockOverlay() {
            this._$dialPanel.unblock();
        },
        _getVoipConfiguration() {
            return ajax.rpc('/web/dataset/call_kw/voip_lirax.configurator/get_config', {
                model: 'voip_lirax.configurator',
                method: 'get_config',
                args: [],
                kwargs: {},
            })
        },
        _initPhone() {
            this._getVoipConfiguration()
                .then(params => this._getPhone(params))
                .then(phone => {
                    this.phone = phone;
                    if (phone) {
                        phone.onOpen = () => this._unblockOverlay();
                        phone.onClose = () => this._blockOverlay('Reconnection...');
                        phone.onDestroy = call => this._onDestroy(call);
                        phone.onCreate = call => this._onCreateCall(call);
                        phone.onConnect = call => this._onConnectCall(call);
                    }
                    return phone;
                });
        },
        _getPhone(params) {
            if (params.login || params.password) {
                this.param = params;
                let phone = new XPhone();
                try {
                    phone.init(params);
                    core.bus.trigger('voip_button_show');
                    return phone
                } catch (e) {
                    this._blockOverlay(_t('The server configuration could be wrong.</br>Please check your configuration.'));
                    return false;
                }
            } else {
                this._blockOverlay(_t('No login or password.</br>Please check your configuration.'));
            }
        },
    });
    WebClient.include({

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        /**
         * @override
         */
        async show_application() {
            await this._super(...arguments);
            this._dialingPanel = new DialingPanel(this);
            await this._dialingPanel.appendTo(this.$el);
            this.on('voip_call', this, this.proxy('_onVoipCall'));
            this.on('get_voip_configuration', this, this.proxy('_onGetVoipConfiguration'));
        },
        _onVoipCall(e) {
            return this._dialingPanel._makeCall(e.data.number);
        },
        _onGetVoipConfiguration() {
            return this._dialingPanel._getVoipConfiguration()
        }
    })
});
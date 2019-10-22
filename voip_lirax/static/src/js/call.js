odoo.define('voip_lirax.call', function (require) {
    "use strict";

    let Widget = require('web.Widget');
    const core = require('web.core');
    const QWeb = core.qweb;

    let CallWidget;
    CallWidget = Widget.extend({
        template: "voip_lirax.CallWidget",
        events: {
            'click .o_hangup': '_onClickHangup',
            'click .js_hold_call': '_onClickHoldCall',
            'click .js_conference': '_onClickConference',
        },
        /**
         * @constructor
         */
        init(parent, phonecall, data) {
            this._super(...arguments);
            this.phone = parent.phone;
            this.phonecall = phonecall;
            this.line = phonecall.line;
            this.number = phonecall.phoneNumber;
            this.interval = null;
            this.startTime = 0;
            this.id = data.id;
            this.partner_name = data.partner_name;
            this.partner_image = data.partner_image;
        },
        async start() {
            this._$holdButton = this.$('.js_hold_call');
            this._$conferenceButton = this.$('.js_conference');
            this.$('.o_call_status').html(QWeb.render('voip.CallStatus', {
                duration: '00:00',
                status: 'connecting',
            }));
        },
        _onClickHangup(e) {
            e.preventDefault();
            this.getParent().phone.finishCall(this.line);
        },
        _onClickConference(e) {
            e.preventDefault();
            if (this.phonecall.conference) {
                this._unconferenceCall()
            } else {
                this._conferenceCall()
            }
        },
        _onClickHoldCall(e) {
            e.preventDefault();
            if (this.phonecall.hold) {
                this._unholdCall()
            } else {
                this._holdCall()
            }
        },
        _holdCall() {
            if (!this.phonecall.hold) {
                this.getParent().phone.holdCall(this.line);
                this._toggleButtonActive(this._$holdButton)
            }
        },
        _unholdCall() {
            if (this.phonecall.hold) {
                this.getParent().phone.holdCall(this.line);
                this._toggleButtonInactive(this._$holdButton)
            }
        },
        _unconferenceCall() {
            if (this.phonecall.conference) {
                this.getParent().phone.conferenceCall(this.line);
                this._toggleButtonInactive(this._$conferenceButton);
            }
        },
        _conferenceCall() {
            if (!this.phonecall.conference) {
                this.getParent().phone.conferenceCall(this.line);
                this._toggleButtonActive(this._$conferenceButton);
            }
        },
        _toggleButtonActive($button) {
            $button.addClass('o_active_button');
            $button.removeClass('o_inactive_button');
        },
        _toggleButtonInactive($button) {
            $button.addClass('o_inactive_button');
            $button.removeClass('o_active_button');
        },
        destroyCall() {
            this.stopTimer();
            return this.destroy();
        },
        /**
         * Starts the timer
         */
        async startTimer() {
            // Set the date we're counting down to
            this.startTime = new Date().getTime();

            // Format timer 00:00
            function formatTimer(val) {
                return val > 9 ? val : "0" + val;
            }

            this.interval = setInterval(() => {
                // Get today's date and time
                let now = new Date().getTime();
                let distance = now - this.startTime;
                const minutes = formatTimer(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
                const seconds = formatTimer(Math.floor((distance % (1000 * 60)) / 1000));
                const duration = _.str.sprintf("%s:%s", minutes, seconds);
                this.$('.o_call_status').html(QWeb.render('voip.CallStatus', {
                    duration,
                    status: 'is_call',
                }));
            }, 1000);

            this._rpc({
                model: 'voip_lirax.phonecall',
                method: 'start_talking',
                args: [this.id],
            });

        },
        stopTimer() {
            // Stop call
            this._rpc({
                model: 'voip_lirax.phonecall',
                method: 'hangup_call',
                args: [this.id],
            });

            clearInterval(this.interval);
        },

    });
    return CallWidget;
});
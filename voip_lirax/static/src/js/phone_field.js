odoo.define('voip.PhoneField', function (require) {
    "use strict";

    const basicFields = require('web.basic_fields');
    const core = require('web.core');
    const config = require('web.config');

    const Phone = basicFields.FieldPhone;
    const _t = core._t;

    if (config.device.isMobile) {
        return;
    }
    Phone.include({
        events: Object.assign({}, Phone.prototype.events, {
            'click': '_onClick',
        }),

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         *
         * @private
         * @param {string} number
         */
        _call(number) {
            this.do_notify(
                _t("Start Calling"),
                _.str.sprintf(_t('Calling %s'), number));
            this.trigger_up('voip_call', {
                number,
                resId: this.res_id,
                resModel: this.model,
            });
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * Called when the phone number is clicked.
         *
         * @private
         * @param {MouseEvent} event
         */
        _onClick(event) {
            event.preventDefault();
            if (this.mode !== 'readonly') {
                return;
            }
            let voipConfiguration;
            this.trigger_up('get_voip_configuration', {
                callback(output) {
                    voipConfiguration = output.voipConfiguration;
                },
            });
            this._call(this.value);
            // if (voipConfiguration.login && voipConfiguration.password) {
            //     ev.preventDefault();
            //     this._call(this.value);
            // }
        },
    });

});

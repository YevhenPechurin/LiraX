odoo.define('voip_lirax.voip_button', function (require) {
    "use strict";

    const core = require('web.core');
    const SystrayMenu = require('web.SystrayMenu');
    const Widget = require('web.Widget');

    let VoipButton = Widget.extend({
        template: 'voip_lirax.voip_button',
        events: {
            "click": "_onClick",
        },
        async start() {
            this.$el.hide();
            core.bus.on('voip_button_show', this, this._onShow);
        },
        willStart() {
            let ready = this.getSession().user_has_group('base.group_user').then(
                function (is_user) {
                    if (!is_user) {
                        return $.Deferred().reject();
                    }
                });
            return $.when(this._super.apply(this, arguments), ready);
        },

        /**
         * @private
         * @param  {MouseEvent} event
         */
        _onClick(event) {
            event.preventDefault();
            core.bus.trigger('voip_onTogglePanel');
        },
        /**
         * @private
         * @param  {MouseEvent} event
         */
        _onHide(event) {
            this.$el.hide();
        },
        _onShow(event) {
            this.$el.show();
        },
    });

    SystrayMenu.Items.push(VoipButton);
});
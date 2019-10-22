# -*- coding: utf-8 -*-

from odoo import api, models
from odoo.exceptions import AccessDenied


class VoipLiraxConfigurator(models.Model):
    _name = 'voip_lirax.configurator'
    _description = 'VOIP LiraX Configurator'

    @api.model
    def get_config(self):
        if not self.env.user.has_group('base.group_user'):
            raise AccessDenied()
        get_param = self.env['ir.config_parameter'].sudo().get_param
        return {'wsServer': get_param('voip_lirax.wsServer', default='wss://lira.voip.com.ua:1887/'),
                'login': self.env.user[0].sip_login,
                'password': self.env.user[0].sip_password,
                'debug': self.user_has_groups('base.group_no_one'),
                'external_phone': self.env.user[0].sip_external_phone,
                'always_transfer': self.env.user[0].sip_always_transfer,
                'ignore_incoming': self.env.user[0].sip_ignore_incoming,
                'mode': get_param('voip_lirax.mode', default="demo"),
                }

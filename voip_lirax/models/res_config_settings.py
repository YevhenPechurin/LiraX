# -*- coding: utf-8 -*-
from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    wsServer = fields.Char("WebSocket", help="The URL of your WebSocket", default='wss://lira.voip.com.ua:1887/', config_parameter='voip_lirax.wsServer')
    mode = fields.Selection([
        ('demo', 'Demo'),
        ('prod', 'Production'),
    ], string="VoIP Environment", default='demo', config_parameter='voip_lirax.mode')

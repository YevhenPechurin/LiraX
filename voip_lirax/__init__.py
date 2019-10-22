# -*- coding: utf-8 -*-

from . import models
from odoo import api, SUPERUSER_ID


def uninstall_hook(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    env['mail.activity.type'].search([('category', '=', 'phonecall')]).write({'category': 'default'})

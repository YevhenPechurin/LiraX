# -*- coding: utf-8 -*-

{
    'name': "VOIP LiraX",
    'description': """
Module with the required configuration to connect to OnSIP.
    """,
    'category': 'Sales',
    'version': '1.0',
    'depends': ['voip'],
    'data': [
        'views/voip_lirax_templates.xml',
        'views/res_config_settings_views.xml',
    ],
    'application': False,
    'license': 'OPL-1',
}

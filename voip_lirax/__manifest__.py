# -*- coding: utf-8 -*-

{
    'name': "VOIP LiraX",

    'summary': """
        Make calls using a VOIP LiraX system""",

    'description': """
        Allow to make call from next activities or with click-to-dial.
    """,

    'category': 'Sales',
    'version': '1.0',

    # any module necessary for this one to work correctly
    'depends': ['base', 'web', 'phone_validation', 'mail'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/res_config_settings_views.xml',
        'views/res_users_views.xml',
        'views/voip_phonecall_views.xml',
    ],
    'qweb': ['static/src/xml/*.xml'],
    'application': True,
    'license': 'LGPL-3',
    'uninstall_hook': "uninstall_hook",
}

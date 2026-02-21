from app import app
from extensions import db
from models import Menu

with app.app_context():
    # 查找项目管理菜单 (ID: 6)
    project_menu = Menu.query.get(6)
    if project_menu:
        # 检查是否已经存在这些菜单项
        existing_menu_names = [child.name for child in project_menu.children]
        
        # 添加智慧服务菜单项
        if '智慧服务' not in existing_menu_names:
            smart_service_menu = Menu(
                name='智慧服务',
                path='/project/smart-service',
                parent_id=6,
                order=5,
                visible=True,
                icon='project'
            )
            db.session.add(smart_service_menu)
            print('添加智慧服务菜单项')
        
        # 添加电子病历菜单项
        if '电子病历' not in existing_menu_names:
            emr_menu = Menu(
                name='电子病历',
                path='/project/emr',
                parent_id=6,
                order=6,
                visible=True,
                icon='project'
            )
            db.session.add(emr_menu)
            print('添加电子病历菜单项')
        
        # 添加互联互通菜单项
        if '互联互通' not in existing_menu_names:
            interconnection_menu = Menu(
                name='互联互通',
                path='/project/interconnection',
                parent_id=6,
                order=7,
                visible=True,
                icon='project'
            )
            db.session.add(interconnection_menu)
            print('添加互联互通菜单项')
        
        # 提交更改
        db.session.commit()
        print('菜单添加完成')
    else:
        print('未找到项目管理菜单')

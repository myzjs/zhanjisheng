from app import app
from extensions import db
from models import Menu

with app.app_context():
    # 查找系统设置菜单
    system_menu = Menu.query.filter_by(name='系统设置').first()
    if system_menu:
        print(f'找到系统设置菜单，ID: {system_menu.id}')
        
        # 检查是否已经存在系统字典菜单项
        existing_menu_names = [child.name for child in system_menu.children]
        
        if '系统字典' not in existing_menu_names:
            # 添加系统字典菜单项
            system_dictionary_menu = Menu(
                name='系统字典',
                path='/system/system-dictionary',
                parent_id=system_menu.id,
                order=10,
                visible=True,
                icon='dict'
            )
            db.session.add(system_dictionary_menu)
            print('添加系统字典菜单项')
            
            # 提交更改
            db.session.commit()
            print('菜单添加完成')
        else:
            print('系统字典菜单项已经存在')
    else:
        print('未找到系统设置菜单')

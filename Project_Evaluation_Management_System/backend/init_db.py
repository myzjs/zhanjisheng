from app import app
from extensions import db
from models import User, Role, Menu, RolePermission, SystemSkin, SystemDict, EvaluationStandard, EMRStandardClause, TrainingCourseware, LearningRecord, ResearchTemplate, VendorResearch

with app.app_context():
    # 先创建数据库表结构
    db.create_all()
    print('数据库表结构创建完成')
    
    # 创建角色
    roles = [
        {'name': '管理员', 'description': '系统管理员，拥有所有权限'},
        {'name': '评审经理', 'description': '负责项目评审管理'},
        {'name': '现场经理', 'description': '负责现场实施管理'},
        {'name': '现场人员', 'description': '负责现场实施工作'},
        {'name': '售前人员', 'description': '负责售前技术支持'},
        {'name': '销售人员', 'description': '负责项目销售'},
        {'name': '需求人员', 'description': '负责需求分析'},
        {'name': '医院人员', 'description': '医院相关人员'}
    ]
    
    for role_data in roles:
        if not Role.query.filter_by(name=role_data['name']).first():
            role = Role(**role_data)
            db.session.add(role)
    
    db.session.commit()
    print('角色创建完成')
    
    # 创建菜单
    menu_data = [
        # 我的待办
        {'name': '我的待办', 'path': '/todo', 'icon': 'todo', 'parent_id': None, 'order': 1},
        {'name': '任务通知', 'path': '/todo/notification', 'icon': 'notification', 'parent_id': 1, 'order': 1},
        {'name': '调研任务', 'path': '/todo/research', 'icon': 'research', 'parent_id': 1, 'order': 2},
        {'name': '实施计划', 'path': '/todo/implementation', 'icon': 'implementation', 'parent_id': 1, 'order': 3},
        {'name': '学习任务', 'path': '/todo/learning', 'icon': 'learning', 'parent_id': 1, 'order': 4},
        # 项目管理
        {'name': '项目管理', 'path': '/project', 'icon': 'project', 'parent_id': None, 'order': 2},
        {'name': '项目清单', 'path': '/project/list', 'icon': 'list', 'parent_id': 6, 'order': 1},
        {'name': '调研任务', 'path': '/project/research', 'icon': 'research', 'parent_id': 6, 'order': 2},
        {'name': '实施计划', 'path': '/project/implementation', 'icon': 'implementation', 'parent_id': 6, 'order': 3},
        {'name': '培训任务', 'path': '/project/training', 'icon': 'training', 'parent_id': 6, 'order': 4},
        # 项目培训
        {'name': '项目培训', 'path': '/training', 'icon': 'training', 'parent_id': None, 'order': 3},
        {'name': '课件管理', 'path': '/training/courseware', 'icon': 'courseware', 'parent_id': 11, 'order': 1},
        {'name': '学习目录', 'path': '/training/catalog', 'icon': 'courseware', 'parent_id': 11, 'order': 2},
        {'name': '查看学习', 'path': '/training/learning', 'icon': 'learning', 'parent_id': 11, 'order': 3},
        # 系统设置
        {'name': '系统设置', 'path': '/system', 'icon': 'system', 'parent_id': None, 'order': 4},
        {'name': '用户管理', 'path': '/system/user', 'icon': 'user', 'parent_id': 14, 'order': 1},
        {'name': '角色授权', 'path': '/system/role', 'icon': 'role', 'parent_id': 14, 'order': 2},
        {'name': '系统皮肤', 'path': '/system/skin', 'icon': 'skin', 'parent_id': 14, 'order': 3},
        {'name': '系统字典', 'path': '/system/dict', 'icon': 'dict', 'parent_id': 14, 'order': 4},
        {'name': '菜单管理', 'path': '/system/menu', 'icon': 'menu', 'parent_id': 14, 'order': 5},
        {'name': '规范目录', 'path': '/system/standard-catalog', 'icon': 'standard', 'parent_id': 14, 'order': 6},
        {'name': '调研模板', 'path': '/system/research-template', 'icon': 'standard', 'parent_id': 14, 'order': 7}
    ]
    
    for menu_item in menu_data:
        if not Menu.query.filter_by(path=menu_item['path']).first():
            menu = Menu(**menu_item)
            db.session.add(menu)
    
    db.session.commit()
    print('菜单创建完成')
    
    # 创建默认皮肤
    default_skin = SystemSkin(
        name='默认皮肤',
        type='default',
        config='{"primaryColor": "#1890ff", "layout": "side", "fixedHeader": true}',
        is_default=True
    )
    if not SystemSkin.query.filter_by(type='default').first():
        db.session.add(default_skin)
    
    # 创建默认管理员用户
    if not User.query.filter_by(username='admin').first():
        admin_user = User(
            username='admin',
            password='admin123',
            name='系统管理员',
            email='admin@example.com',
            role_id=1  # 管理员角色
        )
        db.session.add(admin_user)
    
    db.session.commit()
    print('数据库初始化完成')

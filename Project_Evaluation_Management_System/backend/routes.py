from flask import request, jsonify
from app import app
from extensions import db
from models import User, Role, Menu, RolePermission, SystemSkin, SystemDict, StandardCatalog, ResearchTemplate
import jwt
from datetime import datetime, timedelta

# 登录接口
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or user.password != data['password']:
        return jsonify({'error': '用户名或密码错误'}), 401
    token = jwt.encode({'user_id': user.id, 'exp': datetime.utcnow() + timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'role_id': user.role_id}})

# 注册接口
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': '邮箱已存在'}), 400
    new_user = User(
        username=data['username'],
        password=data['password'],
        name=data['name'],
        email=data['email'],
        role_id=data['role_id']
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': '注册成功'}), 201

# 获取角色列表
@app.route('/api/roles', methods=['GET'])
def get_roles():
    roles = Role.query.all()
    return jsonify([{'id': r.id, 'name': r.name, 'description': r.description} for r in roles])

# 获取菜单列表
@app.route('/api/menus', methods=['GET'])
def get_menus():
    menus = Menu.query.filter_by(parent_id=None).all()
    def format_menu(menu):
        return {
            'id': menu.id,
            'name': menu.name,
            'path': menu.path,
            'icon': menu.icon,
            'parent_id': menu.parent_id,
            'order': menu.order,
            'visible': menu.visible,
            'children': [format_menu(child) for child in menu.children]
        }
    return jsonify([format_menu(menu) for menu in menus])

# 新增菜单
@app.route('/api/menus', methods=['POST'])
def add_menu():
    data = request.get_json()
    new_menu = Menu(
        name=data['name'],
        path=data['path'],
        icon=data.get('icon'),
        parent_id=data.get('parent_id'),
        order=data.get('order', 0),
        visible=data.get('visible', True)
    )
    db.session.add(new_menu)
    db.session.commit()
    return jsonify({'id': new_menu.id, 'message': '菜单添加成功'}), 201

# 更新菜单
@app.route('/api/menus/<int:menu_id>', methods=['PUT'])
def update_menu(menu_id):
    menu = Menu.query.get(menu_id)
    if not menu:
        return jsonify({'error': '菜单不存在'}), 404
    data = request.get_json()
    menu.name = data.get('name', menu.name)
    menu.path = data.get('path', menu.path)
    menu.icon = data.get('icon', menu.icon)
    menu.parent_id = data.get('parent_id', menu.parent_id)
    menu.order = data.get('order', menu.order)
    menu.visible = data.get('visible', menu.visible)
    db.session.commit()
    return jsonify({'message': '菜单更新成功'})

# 删除菜单
@app.route('/api/menus/<int:menu_id>', methods=['DELETE'])
def delete_menu(menu_id):
    menu = Menu.query.get(menu_id)
    if not menu:
        return jsonify({'error': '菜单不存在'}), 404
    db.session.delete(menu)
    db.session.commit()
    return jsonify({'message': '菜单删除成功'})

# 获取角色权限
@app.route('/api/role-permissions/<int:role_id>', methods=['GET'])
def get_role_permissions(role_id):
    permissions = RolePermission.query.filter_by(role_id=role_id).all()
    return jsonify([{'menu_id': p.menu_id, 'can_access': p.can_access} for p in permissions])

# 更新角色权限
@app.route('/api/role-permissions/<int:role_id>', methods=['POST'])
def update_role_permissions(role_id):
    data = request.get_json()
    # 删除旧权限
    RolePermission.query.filter_by(role_id=role_id).delete()
    # 添加新权限
    for perm in data:
        new_perm = RolePermission(
            role_id=role_id,
            menu_id=perm['menu_id'],
            can_access=perm['can_access']
        )
        db.session.add(new_perm)
    db.session.commit()
    return jsonify({'message': '权限更新成功'})

# 获取系统皮肤
@app.route('/api/skins', methods=['GET'])
def get_skins():
    skins = SystemSkin.query.all()
    return jsonify([{'id': s.id, 'name': s.name, 'type': s.type, 'config': s.config, 'is_default': s.is_default} for s in skins])

# 添加系统皮肤
@app.route('/api/skins', methods=['POST'])
def add_skin():
    data = request.get_json()
    new_skin = SystemSkin(
        name=data['name'],
        type=data['type'],
        config=data['config'],
        is_default=data.get('is_default', False)
    )
    db.session.add(new_skin)
    db.session.commit()
    return jsonify({'id': new_skin.id, 'message': '皮肤添加成功'}), 201

# 更新系统皮肤
@app.route('/api/skins/<int:skin_id>', methods=['PUT'])
def update_skin(skin_id):
    skin = SystemSkin.query.get(skin_id)
    if not skin:
        return jsonify({'error': '皮肤不存在'}), 404
    data = request.get_json()
    skin.name = data.get('name', skin.name)
    skin.type = data.get('type', skin.type)
    skin.config = data.get('config', skin.config)
    skin.is_default = data.get('is_default', skin.is_default)
    db.session.commit()
    return jsonify({'message': '皮肤更新成功'})

# 删除系统皮肤
@app.route('/api/skins/<int:skin_id>', methods=['DELETE'])
def delete_skin(skin_id):
    skin = SystemSkin.query.get(skin_id)
    if not skin:
        return jsonify({'error': '皮肤不存在'}), 404
    db.session.delete(skin)
    db.session.commit()
    return jsonify({'message': '皮肤删除成功'})

# 获取系统字典
@app.route('/api/dicts', methods=['GET'])
def get_dicts():
    dicts = SystemDict.query.all()
    return jsonify([{'id': d.id, 'code': d.code, 'name': d.name, 'value': d.value, 'type': d.type} for d in dicts])

# 获取用户列表
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'name': u.name,
        'email': u.email,
        'role_id': u.role_id
    } for u in users])

# 获取单个用户
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify({
        'id': user.id,
        'username': user.username,
        'name': user.name,
        'email': user.email,
        'role_id': user.role_id
    })

# 创建用户
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': '邮箱已存在'}), 400
    new_user = User(
        username=data['username'],
        password=data['password'],
        name=data['name'],
        email=data['email'],
        role_id=data['role_id']
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({
        'id': new_user.id,
        'username': new_user.username,
        'name': new_user.name,
        'email': new_user.email,
        'role_id': new_user.role_id
    }), 201

# 更新用户
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    data = request.get_json()
    if data['username'] != user.username and User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    if data['email'] != user.email and User.query.filter_by(email=data['email']).first():
        return jsonify({'error': '邮箱已存在'}), 400
    user.username = data.get('username', user.username)
    if data.get('password'):
        user.password = data['password']
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.role_id = data.get('role_id', user.role_id)
    db.session.commit()
    return jsonify({
        'id': user.id,
        'username': user.username,
        'name': user.name,
        'email': user.email,
        'role_id': user.role_id
    })

# 删除用户
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': '用户删除成功'})

# 评审标准相关接口
from models import EvaluationStandard

# 获取评审标准列表
@app.route('/api/evaluation-standards', methods=['GET'])
def get_evaluation_standards():
    standards = EvaluationStandard.query.all()
    return jsonify([{
        'id': s.id,
        'standard_id': s.standard_id,
        'standard_name': s.standard_name,
        'standard_short_name': s.standard_short_name,
        'mnemonic': s.mnemonic,
        'content': s.content,
        'status': s.status,
        'version': s.version
    } for s in standards])

# 获取单个评审标准
@app.route('/api/evaluation-standards/<int:standard_id>', methods=['GET'])
def get_evaluation_standard(standard_id):
    standard = EvaluationStandard.query.get(standard_id)
    if not standard:
        return jsonify({'error': '评审标准不存在'}), 404
    return jsonify({
        'id': standard.id,
        'standard_id': standard.standard_id,
        'standard_name': standard.standard_name,
        'standard_short_name': standard.standard_short_name,
        'mnemonic': standard.mnemonic,
        'content': standard.content,
        'status': standard.status,
        'version': standard.version
    })

# 创建评审标准
@app.route('/api/evaluation-standards', methods=['POST'])
def create_evaluation_standard():
    data = request.get_json()
    if EvaluationStandard.query.filter_by(standard_id=data['standard_id']).first():
        return jsonify({'error': '标准ID已存在'}), 400
    new_standard = EvaluationStandard(
        standard_id=data['standard_id'],
        standard_name=data['standard_name'],
        standard_short_name=data['standard_short_name'],
        mnemonic=data['mnemonic'],
        content=data['content'],
        status=data.get('status', '启用'),
        version=data.get('version', '1.0')
    )
    db.session.add(new_standard)
    db.session.commit()
    return jsonify({
        'id': new_standard.id,
        'standard_id': new_standard.standard_id,
        'standard_name': new_standard.standard_name,
        'standard_short_name': new_standard.standard_short_name,
        'mnemonic': new_standard.mnemonic,
        'content': new_standard.content,
        'status': new_standard.status,
        'version': new_standard.version
    }), 201

# 更新评审标准
@app.route('/api/evaluation-standards/<int:standard_id>', methods=['PUT'])
def update_evaluation_standard(standard_id):
    standard = EvaluationStandard.query.get(standard_id)
    if not standard:
        return jsonify({'error': '评审标准不存在'}), 404
    data = request.get_json()
    if data['standard_id'] != standard.standard_id and EvaluationStandard.query.filter_by(standard_id=data['standard_id']).first():
        return jsonify({'error': '标准ID已存在'}), 400
    standard.standard_id = data.get('standard_id', standard.standard_id)
    standard.standard_name = data.get('standard_name', standard.standard_name)
    standard.standard_short_name = data.get('standard_short_name', standard.standard_short_name)
    standard.mnemonic = data.get('mnemonic', standard.mnemonic)
    standard.content = data.get('content', standard.content)
    standard.status = data.get('status', standard.status)
    standard.version = data.get('version', standard.version)
    db.session.commit()
    return jsonify({
        'id': standard.id,
        'standard_id': standard.standard_id,
        'standard_name': standard.standard_name,
        'standard_short_name': standard.standard_short_name,
        'mnemonic': standard.mnemonic,
        'content': standard.content,
        'status': standard.status,
        'version': standard.version
    })

# 删除评审标准
@app.route('/api/evaluation-standards/<int:standard_id>', methods=['DELETE'])
def delete_evaluation_standard(standard_id):
    standard = EvaluationStandard.query.get(standard_id)
    if not standard:
        return jsonify({'error': '评审标准不存在'}), 404
    db.session.delete(standard)
    db.session.commit()
    return jsonify({'message': '评审标准删除成功'})

# EMR标准条款相关接口
from models import EMRStandardClause

# 获取EMR标准条款列表
@app.route('/api/emr-standard-clauses', methods=['GET'])
def get_emr_standard_clauses():
    standard_id = request.args.get('standard_id')
    work_role = request.args.get('work_role')
    business_project = request.args.get('business_project')
    function_score = request.args.get('function_score')
    
    # 构建查询
    query = EMRStandardClause.query
    
    # 添加筛选条件
    if standard_id:
        query = query.filter_by(standard_id=standard_id)
    if work_role and work_role.strip():
        query = query.filter(EMRStandardClause.work_role.like(f'%{work_role}%'))
    if business_project and business_project.strip():
        query = query.filter(EMRStandardClause.business_project.like(f'%{business_project}%'))
    if function_score:
        try:
            score = float(function_score)
            query = query.filter_by(function_score=score)
        except:
            pass
    
    clauses = query.all()
    return jsonify([{
        'id': c.id,
        'standard_id': c.standard_id,
        'project_code': c.project_code,
        'work_role': c.work_role,
        'business_project': c.business_project,
        'evaluation_category': c.evaluation_category,
        'main_evaluation_content': c.main_evaluation_content,
        'function_score': c.function_score,
        'data_quality_evaluation_content': c.data_quality_evaluation_content
    } for c in clauses])

# 获取单个EMR标准条款
@app.route('/api/emr-standard-clauses/<int:clause_id>', methods=['GET'])
def get_emr_standard_clause(clause_id):
    clause = EMRStandardClause.query.get(clause_id)
    if not clause:
        return jsonify({'error': 'EMR标准条款不存在'}), 404
    return jsonify({
        'id': clause.id,
        'standard_id': clause.standard_id,
        'project_code': clause.project_code,
        'work_role': clause.work_role,
        'business_project': clause.business_project,
        'evaluation_category': clause.evaluation_category,
        'main_evaluation_content': clause.main_evaluation_content,
        'function_score': clause.function_score,
        'data_quality_evaluation_content': clause.data_quality_evaluation_content
    })

# 创建EMR标准条款
@app.route('/api/emr-standard-clauses', methods=['POST'])
def create_emr_standard_clause():
    data = request.get_json()
    new_clause = EMRStandardClause(
        standard_id=data['standard_id'],
        project_code=data['project_code'],
        work_role=data['work_role'],
        business_project=data['business_project'],
        evaluation_category=data.get('evaluation_category', '基本'),
        main_evaluation_content=data['main_evaluation_content'],
        function_score=data.get('function_score'),
        data_quality_evaluation_content=data.get('data_quality_evaluation_content')
    )
    db.session.add(new_clause)
    db.session.commit()
    return jsonify({
        'id': new_clause.id,
        'standard_id': new_clause.standard_id,
        'project_code': new_clause.project_code,
        'work_role': new_clause.work_role,
        'business_project': new_clause.business_project,
        'evaluation_category': new_clause.evaluation_category,
        'main_evaluation_content': new_clause.main_evaluation_content,
        'function_score': new_clause.function_score,
        'data_quality_evaluation_content': new_clause.data_quality_evaluation_content
    }), 201

# 更新EMR标准条款
@app.route('/api/emr-standard-clauses/<int:clause_id>', methods=['PUT'])
def update_emr_standard_clause(clause_id):
    clause = EMRStandardClause.query.get(clause_id)
    if not clause:
        return jsonify({'error': 'EMR标准条款不存在'}), 404
    data = request.get_json()
    clause.standard_id = data.get('standard_id', clause.standard_id)
    clause.project_code = data.get('project_code', clause.project_code)
    clause.work_role = data.get('work_role', clause.work_role)
    clause.business_project = data.get('business_project', clause.business_project)
    clause.evaluation_category = data.get('evaluation_category', clause.evaluation_category)
    clause.main_evaluation_content = data.get('main_evaluation_content', clause.main_evaluation_content)
    clause.function_score = data.get('function_score', clause.function_score)
    clause.data_quality_evaluation_content = data.get('data_quality_evaluation_content', clause.data_quality_evaluation_content)
    db.session.commit()
    return jsonify({
        'id': clause.id,
        'standard_id': clause.standard_id,
        'project_code': clause.project_code,
        'work_role': clause.work_role,
        'business_project': clause.business_project,
        'evaluation_category': clause.evaluation_category,
        'main_evaluation_content': clause.main_evaluation_content,
        'function_score': clause.function_score,
        'data_quality_evaluation_content': clause.data_quality_evaluation_content
    })

# 删除EMR标准条款
@app.route('/api/emr-standard-clauses/<int:clause_id>', methods=['DELETE'])
def delete_emr_standard_clause(clause_id):
    clause = EMRStandardClause.query.get(clause_id)
    if not clause:
        return jsonify({'error': 'EMR标准条款不存在'}), 404
    db.session.delete(clause)
    db.session.commit()
    return jsonify({'message': 'EMR标准条款删除成功'})

# 获取EMR标准条款中distinct的工作角色
@app.route('/api/emr-standard-clauses/work-roles', methods=['GET'])
def get_emr_work_roles():
    # 使用distinct()获取唯一的工作角色
    distinct_roles = db.session.query(EMRStandardClause.work_role).distinct().all()
    # 过滤掉空值并格式化返回
    roles = [{'value': role[0], 'name': role[0]} for role in distinct_roles if role[0]]
    return jsonify(roles)

# 获取EMR标准条款中distinct的业务项目
@app.route('/api/emr-standard-clauses/business-projects', methods=['GET'])
def get_emr_business_projects():
    # 使用distinct()获取唯一的业务项目
    distinct_projects = db.session.query(EMRStandardClause.business_project).distinct().all()
    # 过滤掉空值并格式化返回
    projects = [{'value': project[0], 'name': project[0]} for project in distinct_projects if project[0]]
    return jsonify(projects)

# 获取EMR标准条款中distinct的功能评分
@app.route('/api/emr-standard-clauses/function-scores', methods=['GET'])
def get_emr_function_scores():
    # 使用distinct()获取唯一的功能评分
    distinct_scores = db.session.query(EMRStandardClause.function_score).distinct().all()
    # 过滤掉空值并格式化返回为整数，去除分和小数点
    scores = [{'value': score[0], 'name': str(int(score[0]))} for score in distinct_scores if score[0] is not None]
    return jsonify(scores)

# 培训课件相关接口
from models import TrainingCourseware

# 获取培训课件列表
@app.route('/api/training-courseware', methods=['GET'])
def get_training_courseware():
    # 获取查询参数
    course_type = request.args.get('course_type')
    
    # 构建查询
    query = TrainingCourseware.query
    
    # 添加筛选条件
    if course_type:
        query = query.filter_by(course_type=course_type)
    
    # 不加载培训对象关系，避免KeyError
    courseware_list = query.all()
    result = []
    for c in courseware_list:
        # 获取培训对象列表
        training_targets = []
        for role in c.training_targets:
            training_targets.append({
                'id': role.id,
                'name': role.name
            })
        
        result.append({
            'id': c.id,
            'courseware_name': c.courseware_name,
            'attachment': c.attachment,
            'version': c.version,
            'author': c.author,
            'upload_date': c.upload_date,
            'course_duration': c.course_duration,
            'enabled_status': c.enabled_status,
            'course_type': c.course_type,
            'training_targets': training_targets
        })
    return jsonify(result)

# 获取单个培训课件
@app.route('/api/training-courseware/<int:courseware_id>', methods=['GET'])
def get_training_courseware_detail(courseware_id):
    # 不加载培训对象关系，避免KeyError
    courseware = TrainingCourseware.query.get(courseware_id)
    if not courseware:
        return jsonify({'error': '培训课件不存在'}), 404
    
    # 获取培训对象列表
    training_targets = []
    for role in courseware.training_targets:
        training_targets.append({
            'id': role.id,
            'name': role.name
        })
    
    return jsonify({
        'id': courseware.id,
        'courseware_name': courseware.courseware_name,
        'attachment': courseware.attachment,
        'version': courseware.version,
        'author': courseware.author,
        'upload_date': courseware.upload_date,
        'course_duration': courseware.course_duration,
        'enabled_status': courseware.enabled_status,
        'course_type': courseware.course_type,
        'training_targets': training_targets
    })

# 创建培训课件
@app.route('/api/training-courseware', methods=['POST'])
def create_training_courseware():
    data = request.get_json()
    new_courseware = TrainingCourseware(
        courseware_name=data['courseware_name'],
        attachment=data['attachment'],
        version=data['version'],
        author=data['author'],
        course_duration=data.get('course_duration', '1h'),
        enabled_status=data.get('enabled_status', 1),
        course_type=data.get('course_type')
    )
    # 处理培训对象
    if 'training_targets' in data:
        for role_id in data['training_targets']:
            role = Role.query.get(role_id)
            if role:
                new_courseware.training_targets.append(role)
    db.session.add(new_courseware)
    db.session.commit()
    return jsonify({
        'id': new_courseware.id,
        'courseware_name': new_courseware.courseware_name,
        'attachment': new_courseware.attachment,
        'version': new_courseware.version,
        'author': new_courseware.author,
        'upload_date': new_courseware.upload_date,
        'course_duration': new_courseware.course_duration,
        'enabled_status': new_courseware.enabled_status,
        'course_type': new_courseware.course_type,
        'training_targets': []  # 为空列表，避免前端报错
    }), 201

# 更新培训课件
@app.route('/api/training-courseware/<int:courseware_id>', methods=['PUT'])
def update_training_courseware(courseware_id):
    courseware = TrainingCourseware.query.get(courseware_id)
    if not courseware:
        return jsonify({'error': '培训课件不存在'}), 404
    data = request.get_json()
    courseware.courseware_name = data.get('courseware_name', courseware.courseware_name)
    courseware.attachment = data.get('attachment', courseware.attachment)
    courseware.version = data.get('version', courseware.version)
    courseware.author = data.get('author', courseware.author)
    courseware.course_duration = data.get('course_duration', courseware.course_duration)
    courseware.enabled_status = data.get('enabled_status', courseware.enabled_status)
    courseware.course_type = data.get('course_type', courseware.course_type)
    # 处理培训对象
    if 'training_targets' in data:
        # 清空现有培训对象
        courseware.training_targets.clear()
        # 添加新的培训对象
        for role_id in data['training_targets']:
            role = Role.query.get(role_id)
            if role:
                courseware.training_targets.append(role)
    db.session.commit()
    return jsonify({
        'id': courseware.id,
        'courseware_name': courseware.courseware_name,
        'attachment': courseware.attachment,
        'version': courseware.version,
        'author': courseware.author,
        'upload_date': courseware.upload_date,
        'course_duration': courseware.course_duration,
        'enabled_status': courseware.enabled_status,
        'course_type': courseware.course_type,
        'training_targets': []  # 为空列表，避免前端报错
    })

# 删除培训课件
@app.route('/api/training-courseware/<int:courseware_id>', methods=['DELETE'])
def delete_training_courseware(courseware_id):
    courseware = TrainingCourseware.query.get(courseware_id)
    if not courseware:
        return jsonify({'error': '培训课件不存在'}), 404
    db.session.delete(courseware)
    db.session.commit()
    return jsonify({'message': '培训课件删除成功'})

# 评审类型和评审级别相关接口
from models import EvaluationType, EvaluationLevel, EvaluationProject

# 获取评审类型列表
@app.route('/api/evaluation-types', methods=['GET'])
def get_evaluation_types():
    types = EvaluationType.query.all()
    return jsonify([{
        'id': t.id,
        'evaluation_type_id': t.evaluation_type_id,
        'evaluation_type': t.evaluation_type,
        'enabled_status': t.enabled_status
    } for t in types])

# 获取单个评审类型
@app.route('/api/evaluation-types/<int:type_id>', methods=['GET'])
def get_evaluation_type(type_id):
    type_ = EvaluationType.query.get(type_id)
    if not type_:
        return jsonify({'error': '评审类型不存在'}), 404
    return jsonify({
        'id': type_.id,
        'evaluation_type_id': type_.evaluation_type_id,
        'evaluation_type': type_.evaluation_type,
        'enabled_status': type_.enabled_status
    })

# 创建评审类型
@app.route('/api/evaluation-types', methods=['POST'])
def create_evaluation_type():
    data = request.get_json()
    if EvaluationType.query.filter_by(evaluation_type_id=data['evaluation_type_id']).first():
        return jsonify({'error': '评审类型ID已存在'}), 400
    new_type = EvaluationType(
        evaluation_type_id=data['evaluation_type_id'],
        evaluation_type=data['evaluation_type'],
        enabled_status=data.get('enabled_status', 1)
    )
    db.session.add(new_type)
    db.session.commit()
    return jsonify({
        'id': new_type.id,
        'evaluation_type_id': new_type.evaluation_type_id,
        'evaluation_type': new_type.evaluation_type,
        'enabled_status': new_type.enabled_status
    }), 201

# 更新评审类型
@app.route('/api/evaluation-types/<int:type_id>', methods=['PUT'])
def update_evaluation_type(type_id):
    type_ = EvaluationType.query.get(type_id)
    if not type_:
        return jsonify({'error': '评审类型不存在'}), 404
    data = request.get_json()
    if data['evaluation_type_id'] != type_.evaluation_type_id and EvaluationType.query.filter_by(evaluation_type_id=data['evaluation_type_id']).first():
        return jsonify({'error': '评审类型ID已存在'}), 400
    type_.evaluation_type_id = data.get('evaluation_type_id', type_.evaluation_type_id)
    type_.evaluation_type = data.get('evaluation_type', type_.evaluation_type)
    type_.enabled_status = data.get('enabled_status', type_.enabled_status)
    db.session.commit()
    return jsonify({
        'id': type_.id,
        'evaluation_type_id': type_.evaluation_type_id,
        'evaluation_type': type_.evaluation_type,
        'enabled_status': type_.enabled_status
    })

# 删除评审类型
@app.route('/api/evaluation-types/<int:type_id>', methods=['DELETE'])
def delete_evaluation_type(type_id):
    type_ = EvaluationType.query.get(type_id)
    if not type_:
        return jsonify({'error': '评审类型不存在'}), 404
    db.session.delete(type_)
    db.session.commit()
    return jsonify({'message': '评审类型删除成功'})

# 获取评审级别列表
@app.route('/api/evaluation-levels', methods=['GET'])
def get_evaluation_levels():
    evaluation_type_id = request.args.get('evaluation_type_id')
    
    # 构建查询
    query = EvaluationLevel.query
    
    # 添加筛选条件
    if evaluation_type_id:
        query = query.filter_by(evaluation_type_id=evaluation_type_id)
    
    levels = query.all()
    return jsonify([{
        'id': l.id,
        'evaluation_type_id': l.evaluation_type_id,
        'evaluation_level': l.evaluation_level,
        'numeric_level': l.numeric_level,
        'enabled_status': l.enabled_status
    } for l in levels])

# 获取单个评审级别
@app.route('/api/evaluation-levels/<int:level_id>', methods=['GET'])
def get_evaluation_level(level_id):
    level = EvaluationLevel.query.get(level_id)
    if not level:
        return jsonify({'error': '评审级别不存在'}), 404
    return jsonify({
        'id': level.id,
        'evaluation_type_id': level.evaluation_type_id,
        'evaluation_level': level.evaluation_level,
        'numeric_level': level.numeric_level,
        'enabled_status': level.enabled_status
    })

# 创建评审级别
@app.route('/api/evaluation-levels', methods=['POST'])
def create_evaluation_level():
    data = request.get_json()
    new_level = EvaluationLevel(
        evaluation_type_id=data['evaluation_type_id'],
        evaluation_level=data['evaluation_level'],
        numeric_level=data.get('numeric_level'),
        enabled_status=data.get('enabled_status', 1)
    )
    db.session.add(new_level)
    db.session.commit()
    return jsonify({
        'id': new_level.id,
        'evaluation_type_id': new_level.evaluation_type_id,
        'evaluation_level': new_level.evaluation_level,
        'numeric_level': new_level.numeric_level,
        'enabled_status': new_level.enabled_status
    }), 201

# 更新评审级别
@app.route('/api/evaluation-levels/<int:level_id>', methods=['PUT'])
def update_evaluation_level(level_id):
    level = EvaluationLevel.query.get(level_id)
    if not level:
        return jsonify({'error': '评审级别不存在'}), 404
    data = request.get_json()
    level.evaluation_type_id = data.get('evaluation_type_id', level.evaluation_type_id)
    level.evaluation_level = data.get('evaluation_level', level.evaluation_level)
    level.numeric_level = data.get('numeric_level', level.numeric_level)
    level.enabled_status = data.get('enabled_status', level.enabled_status)
    db.session.commit()
    return jsonify({
        'id': level.id,
        'evaluation_type_id': level.evaluation_type_id,
        'evaluation_level': level.evaluation_level,
        'numeric_level': level.numeric_level,
        'enabled_status': level.enabled_status
    })

# 删除评审级别
@app.route('/api/evaluation-levels/<int:level_id>', methods=['DELETE'])
def delete_evaluation_level(level_id):
    level = EvaluationLevel.query.get(level_id)
    if not level:
        return jsonify({'error': '评审级别不存在'}), 404
    db.session.delete(level)
    db.session.commit()
    return jsonify({'message': '评审级别删除成功'})

# 评审项目相关接口

# 获取评审项目列表
@app.route('/api/evaluation-projects', methods=['GET'])
def get_evaluation_projects():
    projects = EvaluationProject.query.all()
    result = []
    for project in projects:
        result.append({
            'id': project.id,
            'project_name': project.project_name,
            'project_manager_id': project.project_manager_id,
            'project_manager_name': project.project_manager.name if project.project_manager else '',
            'project_type': project.project_type,
            'project_type_name': project.type_rel.evaluation_type if project.type_rel else '',
            'project_level': project.project_level,
            'project_level_name': project.level_rel.evaluation_level if project.level_rel else '',
            'site_project_manager_id': project.site_project_manager_id,
            'site_project_manager_name': project.site_project_manager.name if project.site_project_manager else '',
            'project_attribute': project.project_attribute,
            'establishment_date': project.establishment_date,
            'establishment_status': project.establishment_status,
            'establishment_proof': project.establishment_proof
        })
    return jsonify(result)

# 获取单个评审项目
@app.route('/api/evaluation-projects/<int:project_id>', methods=['GET'])
def get_evaluation_project(project_id):
    project = EvaluationProject.query.get(project_id)
    if not project:
        return jsonify({'error': '评审项目不存在'}), 404
    return jsonify({
        'id': project.id,
        'project_name': project.project_name,
        'project_manager_id': project.project_manager_id,
        'project_manager_name': project.project_manager.name if project.project_manager else '',
        'project_type': project.project_type,
        'project_type_name': project.type_rel.evaluation_type if project.type_rel else '',
        'project_level': project.project_level,
        'project_level_name': project.level_rel.evaluation_level if project.level_rel else '',
        'site_project_manager_id': project.site_project_manager_id,
        'site_project_manager_name': project.site_project_manager.name if project.site_project_manager else '',
        'project_attribute': project.project_attribute,
        'establishment_date': project.establishment_date,
        'establishment_status': project.establishment_status,
        'establishment_proof': project.establishment_proof
    })

# 创建评审项目
@app.route('/api/evaluation-projects', methods=['POST'])
def create_evaluation_project():
    data = request.get_json()
    
    # 处理日期转换
    establishment_date = data.get('establishment_date')
    from datetime import datetime
    try:
        if establishment_date:
            # 尝试多种日期格式解析
            try:
                # 尝试解析 ISO 格式日期（带时间部分）
                if 'T' in establishment_date:
                    # 简单粗暴的方法：提取日期部分
                    establishment_date = establishment_date.split('T')[0]
                # 尝试解析 YYYY-MM-DD 格式
                establishment_date = datetime.strptime(establishment_date, '%Y-%m-%d').date()
            except Exception as e:
                # 如果解析失败，使用当前日期
                establishment_date = datetime.now().date()
        else:
            # 如果没有提供日期，使用当前日期
            establishment_date = datetime.now().date()
    except Exception as e:
        # 最后的安全网：确保总是有一个有效的日期
        establishment_date = datetime.now().date()
    
    # 创建新项目
    new_project = EvaluationProject(
        project_id=data['project_id'],
        project_name=data['project_name'],
        project_short_name=data.get('project_short_name', data['project_name'][:100]),
        mnemonic=data.get('mnemonic', data['project_id'][:10]),
        project_manager_id=data['project_manager_id'],
        project_type=data['project_type'],
        project_level=data['project_level'],
        site_project_manager_id=data.get('site_project_manager_id'),
        project_attribute=data.get('project_attribute', '标准'),
        establishment_date=establishment_date,
        establishment_status=data.get('establishment_status', '立项'),
        establishment_proof=data.get('establishment_proof')
    )
    
    db.session.add(new_project)
    db.session.commit()
    
    # 返回创建的项目
    return jsonify({
        'id': new_project.id,
        'project_name': new_project.project_name,
        'project_manager_id': new_project.project_manager_id,
        'project_type': new_project.project_type,
        'project_level': new_project.project_level,
        'site_project_manager_id': new_project.site_project_manager_id,
        'project_attribute': new_project.project_attribute,
        'establishment_date': new_project.establishment_date,
        'establishment_status': new_project.establishment_status,
        'establishment_proof': new_project.establishment_proof
    }), 201

# 更新评审项目
@app.route('/api/evaluation-projects/<int:project_id>', methods=['PUT'])
def update_evaluation_project(project_id):
    project = EvaluationProject.query.get(project_id)
    if not project:
        return jsonify({'error': '评审项目不存在'}), 404
    
    data = request.get_json()
    
    # 更新项目信息
    project.project_id = data.get('project_id', project.project_id)
    project.project_name = data.get('project_name', project.project_name)
    project.project_short_name = data.get('project_short_name', project.project_short_name or data.get('project_name', '')[:100])
    project.mnemonic = data.get('mnemonic', project.mnemonic or data.get('project_id', '')[:10])
    project.project_manager_id = data.get('project_manager_id', project.project_manager_id)
    project.project_type = data.get('project_type', project.project_type)
    project.project_level = data.get('project_level', project.project_level)
    project.site_project_manager_id = data.get('site_project_manager_id', project.site_project_manager_id)
    project.project_attribute = data.get('project_attribute', project.project_attribute)
    
    # 处理日期转换
    establishment_date = data.get('establishment_date')
    if establishment_date:
        # 转换为 Python date 对象
        from datetime import datetime
        try:
            # 尝试解析 ISO 格式日期（带时间部分）
            if 'T' in establishment_date:
                establishment_date = datetime.fromisoformat(establishment_date.replace('Z', '+00:00')).date()
            else:
                # 尝试解析 YYYY-MM-DD 格式
                establishment_date = datetime.strptime(establishment_date, '%Y-%m-%d').date()
            project.establishment_date = establishment_date
        except Exception as e:
            # 如果解析失败，保持原有日期
            pass
    
    project.establishment_status = data.get('establishment_status', project.establishment_status)
    project.establishment_proof = data.get('establishment_proof', project.establishment_proof)
    
    db.session.commit()
    
    return jsonify({
        'id': project.id,
        'project_name': project.project_name,
        'project_manager_id': project.project_manager_id,
        'project_type': project.project_type,
        'project_level': project.project_level,
        'site_project_manager_id': project.site_project_manager_id,
        'project_attribute': project.project_attribute,
        'establishment_date': project.establishment_date,
        'establishment_status': project.establishment_status,
        'establishment_proof': project.establishment_proof
    })

# 删除评审项目
@app.route('/api/evaluation-projects/<int:project_id>', methods=['DELETE'])
def delete_evaluation_project(project_id):
    project = EvaluationProject.query.get(project_id)
    if not project:
        return jsonify({'error': '评审项目不存在'}), 404
    
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': '评审项目删除成功'})

# 学习记录相关接口
from models import LearningRecord
from datetime import datetime, time

# 获取学习记录列表
@app.route('/api/learning-records', methods=['GET'])
def get_learning_records():
    records = LearningRecord.query.all()
    return jsonify([{
        'id': r.id,
        'courseware_name': r.courseware_name,
        'learning_courseware': r.learning_courseware,
        'learning_person': r.learning_person,
        'learning_date': r.learning_date.strftime('%Y-%m-%d') if r.learning_date else None,
        'start_time': r.start_time.strftime('%H:%M') if r.start_time else None,
        'end_time': r.end_time.strftime('%H:%M') if r.end_time else None,
        'learning_duration': r.learning_duration
    } for r in records])

# 获取单个学习记录
@app.route('/api/learning-records/<int:record_id>', methods=['GET'])
def get_learning_record(record_id):
    record = LearningRecord.query.get(record_id)
    if not record:
        return jsonify({'error': '学习记录不存在'}), 404
    return jsonify({
        'id': record.id,
        'courseware_name': record.courseware_name,
        'learning_courseware': record.learning_courseware,
        'learning_person': record.learning_person,
        'learning_date': record.learning_date.strftime('%Y-%m-%d') if record.learning_date else None,
        'start_time': record.start_time.strftime('%H:%M') if record.start_time else None,
        'end_time': record.end_time.strftime('%H:%M') if record.end_time else None,
        'learning_duration': record.learning_duration
    })

# 计算学习时长
import math

def calculate_learning_duration(start_time_str, end_time_str):
    # 解析时间字符串
    start_time = datetime.strptime(start_time_str, '%H:%M').time()
    end_time = datetime.strptime(end_time_str, '%H:%M').time()
    
    # 计算分钟差
    start_minutes = start_time.hour * 60 + start_time.minute
    end_minutes = end_time.hour * 60 + end_time.minute
    duration_minutes = end_minutes - start_minutes
    
    # 根据分钟差计算学习时长
    if 30 <= duration_minutes < 60:
        return '0.5h'
    elif 60 <= duration_minutes < 90:
        return '1h'
    elif 90 <= duration_minutes < 120:
        return '2h'
    else:
        return '0h'  # 默认值

# 创建学习记录
@app.route('/api/learning-records', methods=['POST'])
def create_learning_record():
    data = request.get_json()
    
    # 计算学习时长
    learning_duration = calculate_learning_duration(data['start_time'], data['end_time'])
    
    # 获取课件名称
    courseware = TrainingCourseware.query.get(data['learning_courseware'])
    courseware_name = courseware.courseware_name if courseware else ''
    
    new_record = LearningRecord(
        courseware_name=courseware_name,
        learning_courseware=data['learning_courseware'],
        learning_person=data['learning_person'],
        learning_date=datetime.strptime(data['learning_date'], '%Y-%m-%d').date(),
        start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
        end_time=datetime.strptime(data['end_time'], '%H:%M').time(),
        learning_duration=learning_duration
    )
    
    db.session.add(new_record)
    db.session.commit()
    
    return jsonify({
        'id': new_record.id,
        'courseware_name': new_record.courseware_name,
        'learning_courseware': new_record.learning_courseware,
        'learning_person': new_record.learning_person,
        'learning_date': new_record.learning_date.strftime('%Y-%m-%d'),
        'start_time': new_record.start_time.strftime('%H:%M'),
        'end_time': new_record.end_time.strftime('%H:%M'),
        'learning_duration': new_record.learning_duration
    }), 201

# 更新学习记录
@app.route('/api/learning-records/<int:record_id>', methods=['PUT'])
def update_learning_record(record_id):
    record = LearningRecord.query.get(record_id)
    if not record:
        return jsonify({'error': '学习记录不存在'}), 404
    
    data = request.get_json()
    
    # 计算学习时长
    learning_duration = calculate_learning_duration(data['start_time'], data['end_time'])
    
    # 获取课件名称
    courseware = TrainingCourseware.query.get(data['learning_courseware'])
    courseware_name = courseware.courseware_name if courseware else ''
    
    # 更新字段
    record.courseware_name = courseware_name
    record.learning_courseware = data['learning_courseware']
    record.learning_person = data['learning_person']
    record.learning_date = datetime.strptime(data['learning_date'], '%Y-%m-%d').date()
    record.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
    record.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
    record.learning_duration = learning_duration
    
    db.session.commit()
    
    return jsonify({
        'id': record.id,
        'courseware_name': record.courseware_name,
        'learning_courseware': record.learning_courseware,
        'learning_person': record.learning_person,
        'learning_date': record.learning_date.strftime('%Y-%m-%d'),
        'start_time': record.start_time.strftime('%H:%M'),
        'end_time': record.end_time.strftime('%H:%M'),
        'learning_duration': record.learning_duration
    })

# 删除学习记录
@app.route('/api/learning-records/<int:record_id>', methods=['DELETE'])
def delete_learning_record(record_id):
    record = LearningRecord.query.get(record_id)
    if not record:
        return jsonify({'error': '学习记录不存在'}), 404
    
    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': '学习记录删除成功'})

# 规范目录相关接口

# 获取规范目录列表
@app.route('/api/standard-catalogs', methods=['GET'])
def get_standard_catalogs():
    catalogs = StandardCatalog.query.all()
    return jsonify([{
        'id': c.id,
        'standard_name': c.standard_name,
        'standard_short_name': c.standard_short_name,
        'mnemonic': c.mnemonic,
        'content': c.content,
        'enabled_status': c.enabled_status,
        'version': c.version
    } for c in catalogs])

# 获取单个规范目录
@app.route('/api/standard-catalogs/<int:catalog_id>', methods=['GET'])
def get_standard_catalog(catalog_id):
    catalog = StandardCatalog.query.get(catalog_id)
    if not catalog:
        return jsonify({'error': '规范目录不存在'}), 404
    return jsonify({
        'id': catalog.id,
        'standard_name': catalog.standard_name,
        'standard_short_name': catalog.standard_short_name,
        'mnemonic': catalog.mnemonic,
        'content': catalog.content,
        'enabled_status': catalog.enabled_status,
        'version': catalog.version
    })

# 创建规范目录
@app.route('/api/standard-catalogs', methods=['POST'])
def create_standard_catalog():
    data = request.get_json()
    new_catalog = StandardCatalog(
        standard_name=data['standard_name'],
        standard_short_name=data['standard_short_name'],
        mnemonic=data['mnemonic'],
        content=data['content'],
        enabled_status=data.get('enabled_status', 1),
        version=data.get('version', '1.0')
    )
    db.session.add(new_catalog)
    db.session.commit()
    return jsonify({
        'id': new_catalog.id,
        'standard_name': new_catalog.standard_name,
        'standard_short_name': new_catalog.standard_short_name,
        'mnemonic': new_catalog.mnemonic,
        'content': new_catalog.content,
        'enabled_status': new_catalog.enabled_status,
        'version': new_catalog.version
    }), 201

# 更新规范目录
@app.route('/api/standard-catalogs/<int:catalog_id>', methods=['PUT'])
def update_standard_catalog(catalog_id):
    catalog = StandardCatalog.query.get(catalog_id)
    if not catalog:
        return jsonify({'error': '规范目录不存在'}), 404
    data = request.get_json()
    catalog.standard_name = data.get('standard_name', catalog.standard_name)
    catalog.standard_short_name = data.get('standard_short_name', catalog.standard_short_name)
    catalog.mnemonic = data.get('mnemonic', catalog.mnemonic)
    catalog.content = data.get('content', catalog.content)
    catalog.enabled_status = data.get('enabled_status', catalog.enabled_status)
    catalog.version = data.get('version', catalog.version)
    db.session.commit()
    return jsonify({
        'id': catalog.id,
        'standard_name': catalog.standard_name,
        'standard_short_name': catalog.standard_short_name,
        'mnemonic': catalog.mnemonic,
        'content': catalog.content,
        'enabled_status': catalog.enabled_status,
        'version': catalog.version
    })

# 删除规范目录
@app.route('/api/standard-catalogs/<int:catalog_id>', methods=['DELETE'])
def delete_standard_catalog(catalog_id):
    catalog = StandardCatalog.query.get(catalog_id)
    if not catalog:
        return jsonify({'error': '规范目录不存在'}), 404
    db.session.delete(catalog)
    db.session.commit()
    return jsonify({'message': '规范目录删除成功'})

# 厂商调研表相关接口
from models import VendorResearch

# 获取厂商调研列表
@app.route('/api/vendor-researches', methods=['GET'])
def get_vendor_researches():
    researches = VendorResearch.query.all()
    return jsonify([{
        'id': r.id,
        'research_date': r.research_date.isoformat() if r.research_date else None,
        'researcher_id': r.researcher_id,
        'researcher_name': r.researcher.name if r.researcher else None,
        'project_id': r.project_id,
        'project_name': r.project.project_name if r.project else None,
        'task_name': r.task_name,
        'system_id': r.system_id,
        'system_name': r.system.system_name if r.system else None,
        'manufacturer': r.manufacturer,
        'remarks': r.remarks
    } for r in researches])

# 获取单个厂商调研
@app.route('/api/vendor-researches/<int:research_id>', methods=['GET'])
def get_vendor_research(research_id):
    research = VendorResearch.query.get(research_id)
    if not research:
        return jsonify({'error': '厂商调研不存在'}), 404
    return jsonify({
        'id': research.id,
        'research_date': research.research_date.isoformat() if research.research_date else None,
        'researcher_id': research.researcher_id,
        'researcher_name': research.researcher.name if research.researcher else None,
        'project_id': research.project_id,
        'project_name': research.project.project_name if research.project else None,
        'task_name': research.task_name,
        'system_id': research.system_id,
        'system_name': research.system.system_name if research.system else None,
        'manufacturer': research.manufacturer,
        'remarks': research.remarks
    })

# 创建厂商调研
@app.route('/api/vendor-researches', methods=['POST'])
def create_vendor_research():
    data = request.get_json()
    
    # 处理日期转换
    research_date = data.get('research_date')
    if research_date:
        from datetime import datetime
        try:
            # 尝试解析 ISO 格式日期（带时间部分）
            if 'T' in research_date:
                research_date = datetime.fromisoformat(research_date.replace('Z', '+00:00')).date()
            else:
                # 尝试解析 YYYY-MM-DD 格式
                research_date = datetime.strptime(research_date, '%Y-%m-%d').date()
        except Exception as e:
            # 如果解析失败，使用当前日期
            research_date = db.func.current_date()
    else:
        research_date = db.func.current_date()
    
    new_research = VendorResearch(
        research_date=research_date,
        researcher_id=data['researcher_id'],
        project_id=data['project_id'],
        task_name=data.get('task_name'),
        system_id=data.get('system_id'),
        manufacturer=data['manufacturer'],
        remarks=data.get('remarks')
    )
    db.session.add(new_research)
    db.session.commit()
    return jsonify({
        'id': new_research.id,
        'research_date': new_research.research_date.isoformat() if new_research.research_date else None,
        'researcher_id': new_research.researcher_id,
        'researcher_name': new_research.researcher.name if new_research.researcher else None,
        'project_id': new_research.project_id,
        'project_name': new_research.project.project_name if new_research.project else None,
        'task_name': new_research.task_name,
        'system_id': new_research.system_id,
        'system_name': new_research.system.system_name if new_research.system else None,
        'manufacturer': new_research.manufacturer,
        'remarks': new_research.remarks
    }), 201

# 更新厂商调研
@app.route('/api/vendor-researches/<int:research_id>', methods=['PUT'])
def update_vendor_research(research_id):
    research = VendorResearch.query.get(research_id)
    if not research:
        return jsonify({'error': '厂商调研不存在'}), 404
    data = request.get_json()
    
    # 处理日期转换
    research_date = data.get('research_date')
    if research_date:
        from datetime import datetime
        try:
            # 尝试解析 ISO 格式日期（带时间部分）
            if 'T' in research_date:
                research_date = datetime.fromisoformat(research_date.replace('Z', '+00:00')).date()
            else:
                # 尝试解析 YYYY-MM-DD 格式
                research_date = datetime.strptime(research_date, '%Y-%m-%d').date()
            research.research_date = research_date
        except Exception as e:
            # 如果解析失败，保持原有日期
            pass
    
    research.researcher_id = data.get('researcher_id', research.researcher_id)
    research.project_id = data.get('project_id', research.project_id)
    research.task_name = data.get('task_name', research.task_name)
    research.system_id = data.get('system_id', research.system_id)
    research.manufacturer = data.get('manufacturer', research.manufacturer)
    research.remarks = data.get('remarks', research.remarks)
    db.session.commit()
    return jsonify({
        'id': research.id,
        'research_date': research.research_date.isoformat() if research.research_date else None,
        'researcher_id': research.researcher_id,
        'researcher_name': research.researcher.name if research.researcher else None,
        'project_id': research.project_id,
        'project_name': research.project.project_name if research.project else None,
        'task_name': research.task_name,
        'system_id': research.system_id,
        'system_name': research.system.system_name if research.system else None,
        'manufacturer': research.manufacturer,
        'remarks': research.remarks
    })

# 删除厂商调研
@app.route('/api/vendor-researches/<int:research_id>', methods=['DELETE'])
def delete_vendor_research(research_id):
    research = VendorResearch.query.get(research_id)
    if not research:
        return jsonify({'error': '厂商调研不存在'}), 404
    db.session.delete(research)
    db.session.commit()
    return jsonify({'message': '厂商调研删除成功'})

# 系统字典表（系统名称）相关接口
from models import SystemDictionary

# 获取系统字典表列表
@app.route('/api/system-dictionaries', methods=['GET'])
def get_system_dictionaries():
    dictionaries = SystemDictionary.query.all()
    return jsonify([{
        'id': d.id,
        'system_name': d.system_name,
        'remarks': d.remarks,
        'enabled_status': d.enabled_status
    } for d in dictionaries])

# 导入系统字典数据
@app.route('/api/system-dictionaries/import', methods=['POST'])
def import_system_dictionaries():
    try:
        # 检查是否有文件上传
        if 'file' not in request.files:
            return jsonify({'error': '请上传文件'}), 400
        
        file = request.files['file']
        
        # 检查文件是否为空
        if file.filename == '':
            return jsonify({'error': '请选择文件'}), 400
        
        # 检查文件类型
        if not file.filename.endswith('.csv'):
            return jsonify({'error': '只支持CSV文件'}), 400
        
        # 处理CSV文件
        import csv
        try:
            # 读取CSV文件内容并解码为UTF-8
            file_content = file.read().decode('utf-8')
            # 分割成行
            lines = file_content.splitlines()
            # 使用csv.DictReader处理
            csv_reader = csv.DictReader(lines)
            imported_count = 0
            skipped_count = 0
            
            # 直接使用默认会话
            try:
                for row in csv_reader:
                    try:
                        # 转换数据类型
                        system_name = row.get('system_name')
                        remarks = row.get('remarks', '')
                        enabled_status = row.get('enabled_status', '1')
                        
                        # 跳过中文字段说明行
                        if system_name == '系统名称':
                            skipped_count += 1
                            continue
                        
                        # 转换为适当的类型
                        if enabled_status:
                            enabled_status = int(enabled_status)
                        
                        # 检查必填字段
                        if not system_name or not system_name.strip():
                            skipped_count += 1
                            continue
                        
                        new_dictionary = SystemDictionary(
                            system_name=system_name.strip(),
                            remarks=remarks.strip() if remarks else '',
                            enabled_status=enabled_status
                        )
                        db.session.add(new_dictionary)
                        imported_count += 1
                    except Exception as e:
                        skipped_count += 1
                        continue
                
                # 提交会话
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500
            
            return jsonify({'message': f'成功导入 {imported_count} 条数据，跳过 {skipped_count} 条数据'}), 200
        except Exception as e:
            return jsonify({'error': f'CSV文件格式错误: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'导入失败: {str(e)}'}), 500

# 获取单个系统字典表
@app.route('/api/system-dictionaries/<int:dictionary_id>', methods=['GET'])
def get_system_dictionary(dictionary_id):
    dictionary = SystemDictionary.query.get(dictionary_id)
    if not dictionary:
        return jsonify({'error': '系统字典不存在'}), 404
    return jsonify({
        'id': dictionary.id,
        'system_name': dictionary.system_name,
        'remarks': dictionary.remarks,
        'enabled_status': dictionary.enabled_status
    })

# 创建系统字典表
@app.route('/api/system-dictionaries', methods=['POST'])
def create_system_dictionary():
    data = request.get_json()
    new_dictionary = SystemDictionary(
        system_name=data['system_name'],
        remarks=data.get('remarks'),
        enabled_status=data.get('enabled_status', 1)
    )
    db.session.add(new_dictionary)
    db.session.commit()
    return jsonify({
        'id': new_dictionary.id,
        'system_name': new_dictionary.system_name,
        'remarks': new_dictionary.remarks,
        'enabled_status': new_dictionary.enabled_status
    }), 201

# 更新系统字典表
@app.route('/api/system-dictionaries/<int:dictionary_id>', methods=['PUT'])
def update_system_dictionary(dictionary_id):
    dictionary = SystemDictionary.query.get(dictionary_id)
    if not dictionary:
        return jsonify({'error': '系统字典不存在'}), 404
    data = request.get_json()
    dictionary.system_name = data.get('system_name', dictionary.system_name)
    dictionary.remarks = data.get('remarks', dictionary.remarks)
    dictionary.enabled_status = data.get('enabled_status', dictionary.enabled_status)
    db.session.commit()
    return jsonify({
        'id': dictionary.id,
        'system_name': dictionary.system_name,
        'remarks': dictionary.remarks,
        'enabled_status': dictionary.enabled_status
    })

# 删除系统字典表
@app.route('/api/system-dictionaries/<int:dictionary_id>', methods=['DELETE'])
def delete_system_dictionary(dictionary_id):
    dictionary = SystemDictionary.query.get(dictionary_id)
    if not dictionary:
        return jsonify({'error': '系统字典不存在'}), 404
    db.session.delete(dictionary)
    db.session.commit()
    return jsonify({'message': '系统字典删除成功'})



# 获取调研模板列表
@app.route('/api/research-templates', methods=['GET'])
def get_research_templates():
    templates = ResearchTemplate.query.all()
    result = []
    for q in templates:
        try:
            item = {
                'id': q.id,
                'project_category': q.project_category,
                'project_category_name': q.category.evaluation_type if q.category else '',
                'project_level': q.project_level,
                'project_level_name': q.level.evaluation_level if q.level else '',
                'system_name': q.system_name,
                'system_name_name': q.system.system_name if q.system else '',
                'standard_requirement': q.standard_requirement,
                'requirement_type': q.requirement_type,
                'inspection_project': q.inspection_project,
                'reference_screenshot': q.reference_screenshot,
                'remarks': q.remarks,
                'clause_id': q.clause_id,
                'clause_name': q.clause.business_project if q.clause else '',
                'enabled_status': q.enabled_status
            }
            result.append(item)
        except Exception as e:
            # 处理单个记录的错误，确保其他记录仍能返回
            item = {
                'id': q.id,
                'project_category': q.project_category,
                'project_category_name': '',
                'project_level': q.project_level,
                'project_level_name': '',
                'system_name': q.system_name,
                'system_name_name': '',
                'standard_requirement': q.standard_requirement,
                'requirement_type': q.requirement_type,
                'inspection_project': q.inspection_project,
                'reference_screenshot': q.reference_screenshot,
                'remarks': q.remarks,
                'clause_id': q.clause_id,
                'clause_name': '',
                'enabled_status': q.enabled_status
            }
            result.append(item)
    return jsonify(result)

# 获取单个调研模板
@app.route('/api/research-templates/<int:template_id>', methods=['GET'])
def get_research_template(template_id):
    template = ResearchTemplate.query.get(template_id)
    if not template:
        return jsonify({'error': '调研模板不存在'}), 404
    return jsonify({
        'id': template.id,
        'project_category': template.project_category,
        'project_level': template.project_level,
        'standard_requirement': template.standard_requirement,
        'requirement_type': template.requirement_type,
        'inspection_project': template.inspection_project,
        'reference_screenshot': template.reference_screenshot,
        'remarks': template.remarks,
        'clause_id': template.clause_id,
        'enabled_status': template.enabled_status
    })

# 创建调研模板
@app.route('/api/research-templates', methods=['POST'])
def create_research_template():
    data = request.get_json()
    new_template = ResearchTemplate(
        project_category=data['project_category'],
        project_level=data['project_level'],
        system_name=data.get('system_name'),
        standard_requirement=data['standard_requirement'],
        requirement_type=data['requirement_type'],
        inspection_project=data['inspection_project'],
        reference_screenshot=data.get('reference_screenshot'),
        remarks=data.get('remarks'),
        clause_id=data.get('clause_id'),
        enabled_status=data.get('enabled_status', 1)
    )
    db.session.add(new_template)
    db.session.commit()
    return jsonify({
        'id': new_template.id,
        'project_category': new_template.project_category,
        'project_level': new_template.project_level,
        'system_name': new_template.system_name,
        'standard_requirement': new_template.standard_requirement,
        'requirement_type': new_template.requirement_type,
        'inspection_project': new_template.inspection_project,
        'reference_screenshot': new_template.reference_screenshot,
        'remarks': new_template.remarks,
        'clause_id': new_template.clause_id,
        'enabled_status': new_template.enabled_status
    }), 201

# 更新调研模板
@app.route('/api/research-templates/<int:template_id>', methods=['PUT'])
def update_research_template(template_id):
    template = ResearchTemplate.query.get(template_id)
    if not template:
        return jsonify({'error': '调研模板不存在'}), 404
    data = request.get_json()
    template.project_category = data.get('project_category', template.project_category)
    template.project_level = data.get('project_level', template.project_level)
    template.system_name = data.get('system_name', template.system_name)
    template.standard_requirement = data.get('standard_requirement', template.standard_requirement)
    template.requirement_type = data.get('requirement_type', template.requirement_type)
    template.inspection_project = data.get('inspection_project', template.inspection_project)
    template.reference_screenshot = data.get('reference_screenshot', template.reference_screenshot)
    template.remarks = data.get('remarks', template.remarks)
    template.clause_id = data.get('clause_id', template.clause_id)
    template.enabled_status = data.get('enabled_status', template.enabled_status)
    db.session.commit()
    return jsonify({
        'id': template.id,
        'project_category': template.project_category,
        'project_level': template.project_level,
        'system_name': template.system_name,
        'standard_requirement': template.standard_requirement,
        'requirement_type': template.requirement_type,
        'inspection_project': template.inspection_project,
        'reference_screenshot': template.reference_screenshot,
        'remarks': template.remarks,
        'clause_id': template.clause_id,
        'enabled_status': template.enabled_status
    })

# 删除调研模板
@app.route('/api/research-templates/<int:template_id>', methods=['DELETE'])
def delete_research_template(template_id):
    template = ResearchTemplate.query.get(template_id)
    if not template:
        return jsonify({'error': '调研模板不存在'}), 404
    db.session.delete(template)
    db.session.commit()
    return jsonify({'message': '调研模板删除成功'})



# 导入调研模板数据
@app.route('/api/research-templates/import', methods=['POST'])
def import_research_templates():
    try:
        # 检查是否有文件上传
        if 'file' not in request.files:
            return jsonify({'error': '请上传文件'}), 400
        
        file = request.files['file']
        
        # 检查文件是否为空
        if file.filename == '':
            return jsonify({'error': '请选择文件'}), 400
        
        # 检查文件类型
        if file.filename.endswith('.json'):
            # 处理JSON文件
            import json
            try:
                data = json.load(file)
            except json.JSONDecodeError:
                return jsonify({'error': 'JSON文件格式错误'}), 400
            
            # 检查数据格式
            if isinstance(data, list):
                # 批量导入
                imported_count = 0
                for item in data:
                    try:
                        new_template = ResearchTemplate(
                            project_category=item.get('project_category'),
                            project_level=item.get('project_level'),
                            system_name=item.get('system_name'),
                            standard_requirement=item.get('standard_requirement', ''),
                            requirement_type=item.get('requirement_type', '功能要求'),
                            inspection_project=item.get('inspection_project', ''),
                            reference_screenshot=item.get('reference_screenshot', ''),
                            remarks=item.get('remarks', ''),
                            clause_id=item.get('clause_id'),
                            enabled_status=item.get('enabled_status', 1)
                        )
                        db.session.add(new_template)
                        imported_count += 1
                    except Exception as e:
                        continue
                db.session.commit()
                return jsonify({'message': f'成功导入 {imported_count} 条数据'}), 200
            else:
                # 单个导入
                new_template = ResearchTemplate(
                    project_category=data.get('project_category'),
                    project_level=data.get('project_level'),
                    system_name=data.get('system_name'),
                    standard_requirement=data.get('standard_requirement', ''),
                    requirement_type=data.get('requirement_type', '功能要求'),
                    inspection_project=data.get('inspection_project', ''),
                    reference_screenshot=data.get('reference_screenshot', ''),
                    remarks=data.get('remarks', ''),
                    clause_id=data.get('clause_id'),
                    enabled_status=data.get('enabled_status', 1)
                )
                db.session.add(new_template)
                db.session.commit()
                return jsonify({'message': '数据导入成功'}), 200
        elif file.filename.endswith('.csv'):
            # 处理CSV文件
            import csv
            try:
                # 读取CSV文件内容并解码为UTF-8
                file_content = file.read().decode('utf-8')
                # 分割成行
                lines = file_content.splitlines()
                # 使用csv.DictReader处理
                csv_reader = csv.DictReader(lines)
                imported_count = 0
                skipped_count = 0
                
                # 直接使用默认会话
                try:
                    for row in csv_reader:
                        try:
                            # 转换数据类型
                            project_category = row.get('project_category')
                            project_level = row.get('project_level')
                            system_name = row.get('system_name')
                            clause_id = row.get('clause_id')
                            enabled_status = row.get('enabled_status', '1')
                            
                            # 跳过中文字段说明行
                            if project_category == '项目类别ID(evaluation_type_id)':
                                skipped_count += 1
                                continue
                            
                            # 转换为适当的类型
                            if project_category and project_category.strip():
                                project_category = int(project_category.strip())
                            else:
                                skipped_count += 1
                                continue
                            
                            if project_level and project_level.strip():
                                project_level = int(project_level.strip())
                            else:
                                skipped_count += 1
                                continue
                            
                            if system_name and system_name.strip():
                                system_name = int(system_name.strip())
                            else:
                                system_name = None
                            
                            if clause_id and clause_id.strip():
                                clause_id = int(clause_id.strip())
                            else:
                                clause_id = None
                            
                            if enabled_status:
                                enabled_status = int(enabled_status)
                            
                            # 检查必填字段
                            standard_requirement = row.get('standard_requirement', '').strip()
                            requirement_type = row.get('requirement_type', '功能要求').strip()
                            inspection_project = row.get('inspection_project', '').strip()
                            
                            if not standard_requirement or not requirement_type or not inspection_project:
                                skipped_count += 1
                                continue
                            
                            new_template = ResearchTemplate(
                                project_category=project_category,
                                project_level=project_level,
                                system_name=system_name,
                                standard_requirement=standard_requirement,
                                requirement_type=requirement_type,
                                inspection_project=inspection_project,
                                reference_screenshot=row.get('reference_screenshot', ''),
                                remarks=row.get('remarks', ''),
                                clause_id=clause_id,
                                enabled_status=enabled_status
                            )
                            db.session.add(new_template)
                            imported_count += 1
                        except Exception as e:
                            skipped_count += 1
                            continue
                    
                    # 提交会话
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500
                
                return jsonify({'message': f'成功导入 {imported_count} 条数据，跳过 {skipped_count} 条数据'}), 200
            except Exception as e:
                return jsonify({'error': f'CSV文件格式错误: {str(e)}'}), 400
        else:
            return jsonify({'error': '只支持JSON和CSV文件'}), 400
            
    except Exception as e:
        return jsonify({'error': f'导入失败: {str(e)}'}), 500

# 文件上传接口
import os
from flask import request, jsonify, url_for
from werkzeug.utils import secure_filename

# 确保上传目录存在
UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'mp4', 'pdf'}
# 文件大小限制 (50MB)
MAX_CONTENT_LENGTH = 50 * 1024 * 1024

def allowed_file(filename):
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    else:
        # 处理没有扩展名但文件名本身就是扩展名的情况
        return filename.lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    # 检查是否有文件部分
    if 'file' not in request.files:
        return jsonify({'error': '没有文件被上传'}), 400
    
    file = request.files['file']
    
    # 检查文件是否为空
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 检查文件类型
    if not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件类型，只允许JPG、MP4、PDF'}), 400
    
    # 检查文件大小
    if file.content_length > MAX_CONTENT_LENGTH:
        return jsonify({'error': '文件大小超过限制，最大50MB'}), 400
    
    # 保存文件
    filename = secure_filename(file.filename)
    # 确保文件有正确的扩展名
    has_extension = any(filename.endswith(ext) for ext in ['.pdf', '.jpg', '.jpeg', '.png', '.mp4'])
    
    if not has_extension:
        # 检查文件名本身是否就是扩展名
        if filename.lower() in ['pdf', 'jpg', 'jpeg', 'png', 'mp4']:
            filename = f"{filename}.{filename}"
        else:
            # 尝试从原始文件名中提取扩展名
            original_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
            if original_ext:
                filename = f"{filename}.{original_ext}"
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # 返回文件URL
    file_url = url_for('static', filename=os.path.join('uploads', filename), _external=True)
    return jsonify({'filename': filename, 'url': file_url})


# 调研任务相关接口
from models import ResearchTask

# 获取调研任务列表
@app.route('/api/research-tasks', methods=['GET'])
def get_research_tasks():
    tasks = ResearchTask.query.all()
    result = []
    for task in tasks:
        result.append({
            'id': task.id,
            'project_type': task.project_type,
            'project_type_name': task.type_rel.evaluation_type if task.type_rel else '',
            'project_level': task.project_level,
            'project_level_name': task.level_rel.evaluation_level if task.level_rel else '',
            'project_id': task.project_id,
            'project_name': task.project.project_name if task.project else '',
            'task_name': task.task_name,
            'creator_id': task.creator_id,
            'creator_name': task.creator.name if task.creator else '',
            'created_at': task.created_at,
            'task_status': task.task_status,
            'planned_completion_time': task.planned_completion_time,
            'researcher_id': task.researcher_id,
            'researcher_name': task.researcher.name if task.researcher else '',
            'completer_id': task.completer_id,
            'completer_name': task.completer.name if task.completer else '',
            'actual_completion_time': task.actual_completion_time
        })
    return jsonify(result)

# 获取单个调研任务
@app.route('/api/research-tasks/<int:task_id>', methods=['GET'])
def get_research_task(task_id):
    task = ResearchTask.query.get(task_id)
    if not task:
        return jsonify({'error': '调研任务不存在'}), 404
    return jsonify({
        'id': task.id,
        'project_type': task.project_type,
        'project_level': task.project_level,
        'project_id': task.project_id,
        'task_name': task.task_name,
        'creator_id': task.creator_id,
        'created_at': task.created_at,
        'task_status': task.task_status,
        'planned_completion_time': task.planned_completion_time,
        'researcher_id': task.researcher_id,
        'completer_id': task.completer_id,
        'actual_completion_time': task.actual_completion_time
    })

# 创建调研任务
@app.route('/api/research-tasks', methods=['POST'])
def create_research_task():
    data = request.get_json()
    
    # 处理日期时间转换
    planned_completion_time = data.get('planned_completion_time')
    if planned_completion_time:
        from datetime import datetime
        try:
            # 将ISO格式的日期字符串转换为date对象
            planned_completion_time = datetime.fromisoformat(planned_completion_time.replace('Z', '+00:00')).date()
        except:
            planned_completion_time = None
    
    new_task = ResearchTask(
        project_type=data['project_type'],
        project_level=data['project_level'],
        project_id=data['project_id'],
        task_name=data['task_name'],
        creator_id=data['creator_id'],  # 自动填充当前登录人
        task_status=data.get('task_status', '进度中'),
        planned_completion_time=planned_completion_time,
        researcher_id=data.get('researcher_id'),
        completer_id=data.get('completer_id'),
        actual_completion_time=data.get('actual_completion_time')
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({
        'id': new_task.id,
        'project_type': new_task.project_type,
        'project_level': new_task.project_level,
        'project_id': new_task.project_id,
        'task_name': new_task.task_name,
        'creator_id': new_task.creator_id,
        'created_at': new_task.created_at,
        'task_status': new_task.task_status,
        'planned_completion_time': new_task.planned_completion_time,
        'researcher_id': new_task.researcher_id,
        'completer_id': new_task.completer_id,
        'actual_completion_time': new_task.actual_completion_time
    }), 201

# 更新调研任务
@app.route('/api/research-tasks/<int:task_id>', methods=['PUT'])
def update_research_task(task_id):
    task = ResearchTask.query.get(task_id)
    if not task:
        return jsonify({'error': '调研任务不存在'}), 404
    
    data = request.get_json()
    
    # 处理日期时间转换
    planned_completion_time = data.get('planned_completion_time')
    if planned_completion_time:
        from datetime import datetime
        try:
            # 将ISO格式的日期字符串转换为date对象
            planned_completion_time = datetime.fromisoformat(planned_completion_time.replace('Z', '+00:00')).date()
        except:
            planned_completion_time = None
    
    actual_completion_time = data.get('actual_completion_time')
    if actual_completion_time:
        from datetime import datetime
        try:
            # 将ISO格式的日期字符串转换为date对象
            actual_completion_time = datetime.fromisoformat(actual_completion_time.replace('Z', '+00:00')).date()
        except:
            actual_completion_time = None
    
    # 更新字段
    task.project_type = data.get('project_type', task.project_type)
    task.project_level = data.get('project_level', task.project_level)
    task.project_id = data.get('project_id', task.project_id)
    task.task_name = data.get('task_name', task.task_name)
    task.task_status = data.get('task_status', task.task_status)
    task.planned_completion_time = planned_completion_time
    task.researcher_id = data.get('researcher_id', task.researcher_id)
    task.completer_id = data.get('completer_id', task.completer_id)
    task.actual_completion_time = actual_completion_time
    
    db.session.commit()
    return jsonify({
        'id': task.id,
        'project_type': task.project_type,
        'project_level': task.project_level,
        'project_id': task.project_id,
        'task_name': task.task_name,
        'creator_id': task.creator_id,
        'created_at': task.created_at,
        'task_status': task.task_status,
        'planned_completion_time': task.planned_completion_time,
        'researcher_id': task.researcher_id,
        'completer_id': task.completer_id,
        'actual_completion_time': task.actual_completion_time
    })

# 删除调研任务
@app.route('/api/research-tasks/<int:task_id>', methods=['DELETE'])
def delete_research_task(task_id):
    task = ResearchTask.query.get(task_id)
    if not task:
        return jsonify({'error': '调研任务不存在'}), 404
    
    # 级联删除关联的厂商调研记录
    # 根据任务名称删除关联的厂商调研记录
    related_vendor_researches = VendorResearch.query.filter_by(task_name=task.task_name).all()
    for research in related_vendor_researches:
        db.session.delete(research)
    
    # 删除调研任务本身
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': '调研任务删除成功'})

# 获取调研任务数量（用于生成序列号）
@app.route('/api/research-tasks/count', methods=['GET'])
def get_research_tasks_count():
    count = ResearchTask.query.count()
    return jsonify({'count': count})

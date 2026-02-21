from extensions import db

# 用户表
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    role = db.relationship('Role', backref=db.backref('users', lazy=True))

# 角色表
class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))

# 菜单表
class Menu(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    path = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50))
    parent_id = db.Column(db.Integer, db.ForeignKey('menu.id'))
    order = db.Column(db.Integer, default=0)
    visible = db.Column(db.Boolean, default=True)
    parent = db.relationship('Menu', remote_side=[id], backref=db.backref('children', lazy=True))

# 角色权限表
class RolePermission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    menu_id = db.Column(db.Integer, db.ForeignKey('menu.id'), nullable=False)
    can_access = db.Column(db.Boolean, default=True)
    role = db.relationship('Role', backref=db.backref('permissions', lazy=True))
    menu = db.relationship('Menu', backref=db.backref('permissions', lazy=True))

# 系统皮肤表
class SystemSkin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # default, template, custom
    config = db.Column(db.Text)  # 皮肤配置
    is_default = db.Column(db.Boolean, default=False)

# 系统字典表
class SystemDict(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)

# 系统字典表（系统名称）
class SystemDictionary(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    system_name = db.Column(db.String(100), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    enabled_status = db.Column(db.Integer, nullable=False, default=1)  # 1=启用, 0=禁用

# 评审标准表
class EvaluationStandard(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    standard_id = db.Column(db.String(50), nullable=False, unique=True)
    standard_name = db.Column(db.String(100), nullable=False)
    standard_short_name = db.Column(db.String(50), nullable=False)
    mnemonic = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='启用')
    version = db.Column(db.String(20), nullable=False, default='1.0')

# EMR标准条款表
class EMRStandardClause(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    standard_id = db.Column(db.String(50), nullable=False)
    project_code = db.Column(db.String(50), nullable=False)
    work_role = db.Column(db.String(100), nullable=False)
    business_project = db.Column(db.String(200), nullable=False)
    evaluation_category = db.Column(db.String(20), nullable=False, default='基本')
    main_evaluation_content = db.Column(db.Text, nullable=False)
    function_score = db.Column(db.Float, nullable=True)
    data_quality_evaluation_content = db.Column(db.Text, nullable=True)

# 培训课件和角色的多对多关系表
training_targets = db.Table('training_targets',
    db.Column('courseware_id', db.Integer, db.ForeignKey('training_courseware.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True)
)

# 培训课件表
class TrainingCourseware(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    courseware_name = db.Column(db.String(100), nullable=False)
    attachment = db.Column(db.String(255), nullable=False)
    version = db.Column(db.String(20), nullable=False)
    author = db.Column(db.String(50), nullable=False)
    upload_date = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    course_duration = db.Column(db.String(10), nullable=False, default='1h')
    enabled_status = db.Column(db.Integer, nullable=False, default=1)
    course_type = db.Column(db.Integer, db.ForeignKey('evaluation_type.id'), nullable=True)
    training_targets = db.relationship('Role', secondary=training_targets,
        backref=db.backref('coursewares', lazy=True))
    course_type_rel = db.relationship('EvaluationType', backref=db.backref('coursewares', lazy=True))

# 学习记录表
class LearningRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    courseware_name = db.Column(db.String(100), nullable=False)
    learning_courseware = db.Column(db.Integer, db.ForeignKey('training_courseware.id'), nullable=False)
    learning_person = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    learning_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    learning_duration = db.Column(db.String(10), nullable=False)
    
    # 关系
    courseware = db.relationship('TrainingCourseware', backref=db.backref('learning_records', lazy=True))
    person = db.relationship('User', backref=db.backref('learning_records', lazy=True))

# 评审类型字典表
class EvaluationType(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    evaluation_type_id = db.Column(db.String(50), nullable=False, unique=True)
    evaluation_type = db.Column(db.String(100), nullable=False)
    enabled_status = db.Column(db.Integer, nullable=False, default=1)  # 1=启用, 0=禁用

# 评审级别字典表
class EvaluationLevel(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    evaluation_type_id = db.Column(db.String(50), nullable=False)
    evaluation_level = db.Column(db.String(100), nullable=False)
    numeric_level = db.Column(db.Integer, nullable=True)  # 数字级别，可空
    enabled_status = db.Column(db.Integer, nullable=False, default=1)  # 1=启用, 0=禁用
    
    # 关系
    # 注意：这里使用evaluation_type_id作为外键关联，而不是id
    # 因为用户要求关联的是评审类型字典表的评级类型id字段

# 评审项目表
class EvaluationProject(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.String(50), nullable=False)
    project_name = db.Column(db.String(200), nullable=False)
    project_short_name = db.Column(db.String(100), nullable=False)
    mnemonic = db.Column(db.String(10), nullable=False)
    project_manager_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # 评审项目经理
    project_type = db.Column(db.Integer, db.ForeignKey('evaluation_type.id'), nullable=False)  # 项目类型
    project_level = db.Column(db.Integer, db.ForeignKey('evaluation_level.id'), nullable=False)  # 项目级别
    site_project_manager_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # 现场项目经理
    project_attribute = db.Column(db.String(10), nullable=False, default='标准')  # 非标/标准
    establishment_date = db.Column(db.Date, nullable=False, default=db.func.current_date())  # 立项日期
    establishment_status = db.Column(db.String(10), nullable=False, default='立项')  # 立项/待定
    establishment_proof = db.Column(db.String(255), nullable=True)  # 立项证明（图片格式）
    
    # 关系
    project_manager = db.relationship('User', foreign_keys=[project_manager_id], backref=db.backref('managed_projects', lazy=True))
    site_project_manager = db.relationship('User', foreign_keys=[site_project_manager_id], backref=db.backref('site_managed_projects', lazy=True))
    type_rel = db.relationship('EvaluationType', backref=db.backref('projects', lazy=True))
    level_rel = db.relationship('EvaluationLevel', backref=db.backref('projects', lazy=True))

# 规范目录表
class StandardCatalog(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    standard_name = db.Column(db.String(200), nullable=False)
    standard_short_name = db.Column(db.String(100), nullable=False)
    mnemonic = db.Column(db.String(10), nullable=False)
    content = db.Column(db.Text, nullable=False)
    enabled_status = db.Column(db.Integer, nullable=False, default=1)  # 1=启用，0=禁用
    version = db.Column(db.String(20), nullable=False, default='1.0')



# 调研模版表
class ResearchTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_category = db.Column(db.Integer, db.ForeignKey('evaluation_type.id'), nullable=False)  # 关联评审类型字典表的评级类型
    project_level = db.Column(db.Integer, db.ForeignKey('evaluation_level.id'), nullable=False)  # 关联评审级别字典表的评审级别
    system_name = db.Column(db.Integer, db.ForeignKey('system_dictionary.id'), nullable=True)  # 关联系统字典表的id
    standard_requirement = db.Column(db.Text, nullable=False)  # 标准要求
    requirement_type = db.Column(db.String(20), nullable=False)  # 要求类型（功能要求/应用量要求/其它要求）
    inspection_project = db.Column(db.String(200), nullable=False)  # 考察项目（对应EMR标准条款表的业务项目）
    reference_screenshot = db.Column(db.String(255), nullable=True)  # 参考截图
    remarks = db.Column(db.Text, nullable=True)  # 备注说明
    clause_id = db.Column(db.Integer, db.ForeignKey('emr_standard_clause.id'), nullable=True)  # 对应标准条款ID（关联EMR标准条款表的id）
    enabled_status = db.Column(db.Integer, nullable=False, default=1)  # 1=启用，0=禁用
    
    # 关系
    category = db.relationship('EvaluationType', backref=db.backref('research_templates', lazy=True))
    level = db.relationship('EvaluationLevel', backref=db.backref('research_templates', lazy=True))
    system = db.relationship('SystemDictionary', backref=db.backref('research_templates', lazy=True))
    clause = db.relationship('EMRStandardClause', backref=db.backref('research_templates', lazy=True))


# 调研任务表
class ResearchTask(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_type = db.Column(db.Integer, db.ForeignKey('evaluation_type.id'), nullable=False)  # 项目类型（关联评审类型字典表的id）
    project_level = db.Column(db.Integer, db.ForeignKey('evaluation_level.id'), nullable=False)  # 项目级别（关联评审级别字典表的id）
    project_id = db.Column(db.Integer, db.ForeignKey('evaluation_project.id'), nullable=False)  # 项目id（关联评审项目表的ID）
    task_name = db.Column(db.String(200), nullable=False)  # 任务名称（默认规则：项目id+项目类型+项目级别+2位year（当前日期）+序列号）
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # 创建人（默认当前登录人）
    created_at = db.Column(db.Date, nullable=False, default=db.func.current_date())  # 创建时间（默认当前日期，年月日）
    task_status = db.Column(db.String(20), nullable=False, default='进度中')  # 任务状态（已完成/进度中/超时，默认进度中）
    planned_completion_time = db.Column(db.Date, nullable=False)  # 计划完成时间（默认当前日期+7天，年月日）
    researcher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # 调研人（默认当前登录人，关联用户表的id）
    completer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # 完成人（关联用户表的id）
    actual_completion_time = db.Column(db.Date, nullable=True)  # 实际完成时间
    vendor_Status = db.Column(db.Integer, nullable=False, default=0)  # 厂商调研状态，默认0
    Benchmarking_Status = db.Column(db.Integer, nullable=False, default=0)  # 标杆调研状态，默认0
    
    # 关系
    project = db.relationship('EvaluationProject', backref=db.backref('research_tasks', lazy=True))
    creator = db.relationship('User', foreign_keys=[creator_id], backref=db.backref('created_research_tasks', lazy=True))
    researcher = db.relationship('User', foreign_keys=[researcher_id], backref=db.backref('assigned_research_tasks', lazy=True))
    completer = db.relationship('User', foreign_keys=[completer_id], backref=db.backref('completed_research_tasks', lazy=True))
    type_rel = db.relationship('EvaluationType', backref=db.backref('research_tasks', lazy=True))
    level_rel = db.relationship('EvaluationLevel', backref=db.backref('research_tasks', lazy=True))


# 厂商调研表
class VendorResearch(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # 主键，自增
    research_date = db.Column(db.Date, nullable=False, default=db.func.current_date())  # 调研日期（格式：年月日）
    researcher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # 调研人（默认当前登录人，关联用户表的id）
    project_id = db.Column(db.Integer, db.ForeignKey('evaluation_project.id'), nullable=False)  # 项目id（关联评审项目表的id）
    task_name = db.Column(db.String(200), nullable=True)  # 任务名称（关联调研任务表的任务名称）
    system_id = db.Column(db.Integer, db.ForeignKey('system_dictionary.id'), nullable=True)  # 系统id（关联系统字典表的id）
    manufacturer = db.Column(db.String(100), nullable=False)  # 制造商
    remarks = db.Column(db.Text, nullable=True)  # 备注
    
    # 关系
    researcher = db.relationship('User', backref=db.backref('vendor_researches', lazy=True))
    project = db.relationship('EvaluationProject', backref=db.backref('vendor_researches', lazy=True))
    system = db.relationship('SystemDictionary', backref=db.backref('vendor_researches', lazy=True))

# 更新数据库，添加评审类型和评审级别字典表
from app import app
from extensions import db
from models import EvaluationType, EvaluationLevel

with app.app_context():
    # 创建所有表
    db.create_all()
    print("数据库表创建成功！")
    print("已添加以下表：")
    print("1. EvaluationType (评审类型字典表)")
    print("2. EvaluationLevel (评审级别字典表)")
    print("\n表结构：")
    print("EvaluationType:")
    print("- id (主键，自增)")
    print("- evaluation_type_id (评级类型id)")
    print("- evaluation_type (评级类型)")
    print("- enabled_status (启用状态，1=启用, 0=禁用)")
    print("\nEvaluationLevel:")
    print("- id (主键，自增)")
    print("- evaluation_type_id (关联评审类型字典表的评级类型id)")
    print("- evaluation_level (评审级别)")
    print("- enabled_status (启用状态，1=启用, 0=禁用)")

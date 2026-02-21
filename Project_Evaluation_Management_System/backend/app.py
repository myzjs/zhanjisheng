from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# 配置SQLite数据库
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project_evaluation.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 初始化数据库
from extensions import db
db.init_app(app)

# 导入模型和路由
from models import User, Role, Menu, RolePermission, SystemSkin, SystemDict, SystemDictionary, EvaluationStandard
from routes import *

if __name__ == '__main__':
    app.run(debug=True, port=5001)

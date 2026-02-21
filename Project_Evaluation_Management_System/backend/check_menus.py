from app import app
from extensions import db
from models import Menu

with app.app_context():
    menus = Menu.query.all()
    for menu in menus:
        print(f'ID: {menu.id}, Name: {menu.name}, Path: {menu.path}, Parent ID: {menu.parent_id}, Order: {menu.order}')
        for child in menu.children:
            print(f'  Child: ID: {child.id}, Name: {child.name}, Path: {child.path}, Parent ID: {child.parent_id}, Order: {child.order}')

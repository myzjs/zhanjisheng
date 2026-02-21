import { useState, useEffect } from 'react';
import { Table, Button, Form, Select, Tree, message, Modal } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TreeNode } = Tree;

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/roles');
      setRoles(response.data);
    } catch (error) {
      message.error('获取角色失败');
    }
  };

  // 获取菜单列表
  const fetchMenus = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/menus');
      setMenus(response.data);
    } catch (error) {
      message.error('获取菜单失败');
    }
  };

  // 获取角色权限
  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/role-permissions/${roleId}`);
      setPermissions(response.data);
    } catch (error) {
      message.error('获取权限失败');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, []);

  // 编辑角色权限
  const handleEditRole = (role) => {
    setSelectedRole(role);
    fetchRolePermissions(role.id);
    setIsModalVisible(true);
  };

  // 构建权限树
  const buildPermissionTree = (menuList) => {
    return menuList.map(menu => {
      if (menu.children && menu.children.length > 0) {
        return (
          <TreeNode title={menu.name} key={menu.id.toString()}>
            {buildPermissionTree(menu.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={menu.name} key={menu.id.toString()} />;
    });
  };

  // 处理权限变更
  const handlePermissionChange = (checkedKeys, info) => {
    console.log('handlePermissionChange:', checkedKeys, info);
    
    // 确保checkedKeys是数组
    if (!Array.isArray(checkedKeys)) {
      console.error('checkedKeys不是数组:', checkedKeys);
      return;
    }
    
    // 构建所有菜单的权限列表
    const allMenuIds = new Set();
    const collectMenuIds = (menuList) => {
      menuList.forEach(menu => {
        allMenuIds.add(menu.id);
        if (menu.children) {
          collectMenuIds(menu.children);
        }
      });
    };
    collectMenuIds(menus);
    
    // 将checkedKeys转换为数字类型，以便与menuId比较
    const checkedIds = checkedKeys.map(key => parseInt(key, 10));
    
    // 根据checkedKeys生成新的权限列表
    const newPermissions = Array.from(allMenuIds).map(menuId => ({
      menu_id: menuId,
      can_access: checkedIds.includes(menuId)
    }));
    
    console.log('新权限列表:', newPermissions);
    setPermissions(newPermissions);
  };

  // 保存角色权限
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      await axios.post(`http://localhost:5001/api/role-permissions/${selectedRole.id}`, permissions);
      message.success('权限更新成功');
      setIsModalVisible(false);
    } catch (error) {
      message.error('权限更新失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={() => handleEditRole(record)} 
        >
          编辑权限
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>角色授权</h2>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={roles} 
        pagination={{ pageSize: 10 }} 
      />

      <Modal
        title={`编辑 ${selectedRole?.name} 权限`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSavePermissions}
            loading={loading}
          >
            保存权限
          </Button>,
        ]}
        width={600}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <Tree
            checkable
            onCheck={(checkedKeys, info) => {
              console.log('Tree onCheck:', checkedKeys, info);
              handlePermissionChange(checkedKeys, info);
            }}
            checkedKeys={permissions.filter(p => p.can_access).map(p => p.menu_id.toString())}
          >
            {buildPermissionTree(menus)}
          </Tree>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;

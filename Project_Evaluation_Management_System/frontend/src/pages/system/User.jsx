import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Typography
} from 'antd';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

const User = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/users');
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/roles');
      setRoles(response.data);
    } catch (error) {
      message.error('获取角色列表失败');
      console.error('Error fetching roles:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // 打开新增用户模态框
  const showAddModal = () => {
    setCurrentUser(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑用户模态框
  const showEditModal = (user) => {
    setCurrentUser(user);
    setIsEditMode(true);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      password: ''
    });
    setIsModalVisible(true);
  };

  // 保存用户
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新用户
        await axios.put(`http://localhost:5001/api/users/${currentUser.id}`, values);
        message.success('用户更新成功');
      } else {
        // 创建用户
        await axios.post('http://localhost:5001/api/users', values);
        message.success('用户创建成功');
      }
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error(isEditMode ? '用户更新失败' : '用户创建失败');
      console.error('Error saving user:', error);
    }
  };

  // 删除用户
  const handleDelete = async (user_id) => {
    try {
      await axios.delete(`http://localhost:5001/api/users/${user_id}`);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      message.error('用户删除失败');
      console.error('Error deleting user:', error);
    }
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role_id',
      key: 'role_id',
      render: (role_id) => {
        if (!role_id) return '未知';
        const role = roles.find(r => r.id === role_id);
        return role ? role.name : '未知';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <Title level={2}>用户管理</Title>
      
      <Button type="primary" onClick={showAddModal} style={{ marginBottom: 16 }}>
        新增用户
      </Button>
      
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          <Form.Item
            name="role_id"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[isEditMode ? {} : { required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={isEditMode ? '不修改请留空' : '请输入密码'} />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建用户'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default User;

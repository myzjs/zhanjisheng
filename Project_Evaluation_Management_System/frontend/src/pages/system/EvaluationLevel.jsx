import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Typography
} from 'antd';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

const EvaluationLevel = () => {
  const [levels, setLevels] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 获取评审类型列表
  const fetchTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-types');
      setTypes(response.data);
    } catch (error) {
      message.error('获取评审类型失败');
      console.error('Error fetching evaluation types:', error);
    }
  };

  // 获取评审级别列表
  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-levels');
      setLevels(response.data);
    } catch (error) {
      message.error('获取评审级别失败');
      console.error('Error fetching evaluation levels:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTypes();
    fetchLevels();
  }, []);

  // 打开新增评审级别模态框
  const showAddModal = () => {
    setCurrentLevel(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑评审级别模态框
  const showEditModal = (level) => {
    setCurrentLevel(level);
    setIsEditMode(true);
    form.setFieldsValue(level);
    setIsModalVisible(true);
  };

  // 保存评审级别
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新评审级别
        await axios.put(`http://localhost:5001/api/evaluation-levels/${currentLevel.id}`, values);
        message.success('评审级别更新成功');
      } else {
        // 创建评审级别
        await axios.post('http://localhost:5001/api/evaluation-levels', values);
        message.success('评审级别创建成功');
      }
      setIsModalVisible(false);
      fetchLevels();
    } catch (error) {
      message.error(isEditMode ? '评审级别更新失败' : '评审级别创建失败');
      console.error('Error saving evaluation level:', error);
    }
  };

  // 删除评审级别
  const handleDelete = async (levelId) => {
    try {
      await axios.delete(`http://localhost:5001/api/evaluation-levels/${levelId}`);
      message.success('评审级别删除成功');
      fetchLevels();
    } catch (error) {
      message.error('评审级别删除失败');
      console.error('Error deleting evaluation level:', error);
    }
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '评审类型ID',
      dataIndex: 'evaluation_type_id',
      key: 'evaluation_type_id',
      width: 150,
    },
    {
      title: '评审类型',
      dataIndex: 'evaluation_type_id',
      key: 'evaluation_type_name',
      width: 200,
      render: (typeId) => {
        const type = types.find(t => t.evaluation_type_id === typeId);
        return type ? type.evaluation_type : typeId;
      },
    },
    {
      title: '评审级别',
      dataIndex: 'evaluation_level',
      key: 'evaluation_level',
      width: 200,
    },
    {
      title: '数字级别',
      dataIndex: 'numeric_level',
      key: 'numeric_level',
      width: 100,
      render: (numericLevel) => (
        <span>{numericLevel || '-'}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled_status',
      key: 'enabled_status',
      width: 100,
      render: (status) => (
        <span>{status === 1 ? '启用' : '禁用'}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个评审级别吗？"
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
    <div className="evaluation-level-management">
      <Title level={2}>评审级别管理</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={showAddModal}>
          新增评审级别
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={levels}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑评审级别' : '新增评审级别'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="evaluation_type_id"
            label="评审类型ID"
            rules={[{ required: true, message: '请选择评审类型' }]}
          >
            <Select placeholder="请选择评审类型">
              {types.map(type => (
                <Option key={type.evaluation_type_id} value={type.evaluation_type_id}>
                  {type.evaluation_type_id} - {type.evaluation_type}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="evaluation_level"
            label="评审级别"
            rules={[{ required: true, message: '请输入评审级别' }]}
          >
            <Input placeholder="请输入评审级别" />
          </Form.Item>
          
          <Form.Item
            name="numeric_level"
            label="数字级别"
            rules={[{ pattern: /^\d*$/, message: '请输入数字' }]}
          >
            <Input placeholder="请输入数字级别（可选）" />
          </Form.Item>
          
          <Form.Item
            name="enabled_status"
            label="状态"
            initialValue={1}
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建评审级别'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EvaluationLevel;
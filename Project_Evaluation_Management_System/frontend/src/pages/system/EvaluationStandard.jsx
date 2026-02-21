import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Typography, InputNumber
} from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;
const { TextArea } = Input;

const EvaluationStandard = () => {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStandard, setCurrentStandard] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();

  // 获取评审标准列表
  const fetchStandards = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-standards');
      setStandards(response.data);
    } catch (error) {
      message.error('获取评审标准失败');
      console.error('Error fetching standards:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchStandards();
  }, []);

  // 打开新增评审标准模态框
  const showAddModal = () => {
    setCurrentStandard(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑评审标准模态框
  const showEditModal = (standard) => {
    setCurrentStandard(standard);
    setIsEditMode(true);
    form.setFieldsValue(standard);
    setIsModalVisible(true);
  };

  // 保存评审标准
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新评审标准
        await axios.put(`http://localhost:5001/api/evaluation-standards/${currentStandard.id}`, values);
        message.success('评审标准更新成功');
      } else {
        // 创建评审标准
        await axios.post('http://localhost:5001/api/evaluation-standards', values);
        message.success('评审标准创建成功');
      }
      setIsModalVisible(false);
      fetchStandards();
    } catch (error) {
      message.error(isEditMode ? '评审标准更新失败' : '评审标准创建失败');
      console.error('Error saving standard:', error);
    }
  };

  // 删除评审标准
  const handleDelete = async (standardId) => {
    try {
      await axios.delete(`http://localhost:5001/api/evaluation-standards/${standardId}`);
      message.success('评审标准删除成功');
      fetchStandards();
    } catch (error) {
      message.error('评审标准删除失败');
      console.error('Error deleting standard:', error);
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
      title: '标准编号',
      dataIndex: 'standard_id',
      key: 'standard_id',
      width: 120,
    },
    {
      title: '标准名称',
      dataIndex: 'standard_name',
      key: 'standard_name',
    },
    {
      title: '标准简称',
      dataIndex: 'standard_short_name',
      key: 'standard_short_name',
      width: 120,
    },
    {
      title: '助记码',
      dataIndex: 'mnemonic',
      key: 'mnemonic',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => navigate(`/system/emr-standard-clause?standard_id=${record.standard_id}`)}>
            条款维护
          </Button>
          <Popconfirm
            title="确定要删除这个评审标准吗？"
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
    <div className="evaluation-standard-management">
      <Title level={2}>评审标准管理</Title>
      
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={showAddModal}>
          新增评审标准
        </Button>
        <Button type="primary" onClick={() => navigate('/training/courseware')}>
          新增培训课件
        </Button>
        <Button type="primary" onClick={() => navigate('/system/research-template')}>
          调研模版维护
        </Button>
      </Space>
      
      <Table
        columns={columns}
        dataSource={standards}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑评审标准' : '新增评审标准'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="standard_id"
            label="标准编号"
            rules={[{ required: true, message: '请输入标准编号' }]}
          >
            <Input placeholder="请输入标准编号" />
          </Form.Item>
          
          <Form.Item
            name="standard_name"
            label="标准名称"
            rules={[{ required: true, message: '请输入标准名称' }]}
          >
            <Input placeholder="请输入标准名称" />
          </Form.Item>
          
          <Form.Item
            name="standard_short_name"
            label="标准简称"
            rules={[{ required: true, message: '请输入标准简称' }]}
          >
            <Input placeholder="请输入标准简称" />
          </Form.Item>
          
          <Form.Item
            name="mnemonic"
            label="助记码"
            rules={[{ required: true, message: '请输入助记码' }]}
          >
            <Input placeholder="请输入助记码" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="标准内容"
            rules={[{ required: true, message: '请输入标准内容' }]}
          >
            <TextArea 
              placeholder="请输入标准内容" 
              rows={4} 
              showCount 
              maxLength={1000}
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            initialValue="启用"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="启用">启用</Option>
              <Option value="禁用">禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="version"
            label="版本"
            initialValue="1.0"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="请输入版本号" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建标准'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EvaluationStandard;
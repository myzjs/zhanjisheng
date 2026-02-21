import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Select, message, 
  Popconfirm, Space, Typography, DatePicker, TimePicker 
} from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;
const { RangePicker } = TimePicker;

const Learning = () => {
  const [learningRecords, setLearningRecords] = useState([]);
  const [coursewares, setCoursewares] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();

  // 获取学习记录列表
  const fetchLearningRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/learning-records');
      setLearningRecords(response.data);
    } catch (error) {
      message.error('获取学习记录失败');
      console.error('Error fetching learning records:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取培训课件列表
  const fetchCoursewares = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/training-courseware');
      setCoursewares(response.data);
    } catch (error) {
      message.error('获取培训课件失败');
      console.error('Error fetching coursewares:', error);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/users');
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('Error fetching users:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchLearningRecords();
    fetchCoursewares();
    fetchUsers();
  }, []);

  // 打开新增学习记录模态框
  const showAddModal = () => {
    setCurrentRecord(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑学习记录模态框
  const showEditModal = (record) => {
    setCurrentRecord(record);
    setIsEditMode(true);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // 保存学习记录
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新学习记录
        await axios.put(`http://localhost:5001/api/learning-records/${currentRecord.id}`, values);
        message.success('学习记录更新成功');
      } else {
        // 创建学习记录
        await axios.post('http://localhost:5001/api/learning-records', values);
        message.success('学习记录创建成功');
      }
      setIsModalVisible(false);
      fetchLearningRecords();
    } catch (error) {
      message.error(isEditMode ? '学习记录更新失败' : '学习记录创建失败');
      console.error('Error saving learning record:', error);
    }
  };

  // 删除学习记录
  const handleDelete = async (recordId) => {
    try {
      await axios.delete(`http://localhost:5001/api/learning-records/${recordId}`);
      message.success('学习记录删除成功');
      fetchLearningRecords();
    } catch (error) {
      message.error('学习记录删除失败');
      console.error('Error deleting learning record:', error);
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
      title: '课件名称',
      dataIndex: 'courseware_name',
      key: 'courseware_name',
    },
    {
      title: '学习人员',
      dataIndex: 'learning_person',
      key: 'learning_person',
      render: (personId) => {
        const user = users.find(u => u.id === personId);
        return user ? user.name : '-';
      },
      width: 120,
    },
    {
      title: '学习日期',
      dataIndex: 'learning_date',
      key: 'learning_date',
      width: 120,
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 100,
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 100,
    },
    {
      title: '学习时长',
      dataIndex: 'learning_duration',
      key: 'learning_duration',
      width: 100,
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
            title="确定要删除这个学习记录吗？"
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
    <div className="learning-management">
      <Title level={2}>学习记录管理</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={showAddModal}>
          新增学习记录
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={learningRecords}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑学习记录' : '新增学习记录'}
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
            name="learning_courseware"
            label="学习课件"
            rules={[{ required: true, message: '请选择学习课件' }]}
          >
            <Select placeholder="请选择学习课件">
              {coursewares.map(courseware => (
                <Option key={courseware.id} value={courseware.id}>
                  {courseware.courseware_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="learning_person"
            label="学习人员"
            rules={[{ required: true, message: '请选择学习人员' }]}
          >
            <Select placeholder="请选择学习人员">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="learning_date"
            label="学习日期"
            rules={[{ required: true, message: '请选择学习日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="start_time"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          
          <Form.Item
            name="end_time"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建记录'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Learning;

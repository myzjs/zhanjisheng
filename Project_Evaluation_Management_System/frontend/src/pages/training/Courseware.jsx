import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography, Upload, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const { Title } = Typography;

const Courseware = () => {
  const [coursewareList, setCoursewareList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCourseware, setCurrentCourseware] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 获取培训课件列表
  const fetchCoursewareList = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/training-courseware');
      setCoursewareList(response.data);
    } catch (error) {
      message.error('获取培训课件失败');
      console.error('Error fetching courseware:', error);
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

  // 获取评审类型列表
  const fetchEvaluationTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-types');
      setEvaluationTypes(response.data);
    } catch (error) {
      message.error('获取评审类型失败');
      console.error('Error fetching evaluation types:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchCoursewareList();
    fetchRoles();
    fetchEvaluationTypes();
  }, []);

  // 打开新增课件模态框
  const showAddModal = () => {
    setCurrentCourseware(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑课件模态框
  const showEditModal = (courseware) => {
    setCurrentCourseware(courseware);
    setIsEditMode(true);
    // 设置培训对象为角色ID数组
    const trainingTargetIds = courseware.training_targets ? courseware.training_targets.map(target => target.id) : [];
    form.setFieldsValue({
      ...courseware,
      training_targets: trainingTargetIds
    });
    setIsModalVisible(true);
  };

  // 保存课件
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新课件
        await axios.put(`http://localhost:5001/api/training-courseware/${currentCourseware.id}`, values);
        message.success('培训课件更新成功');
      } else {
        // 创建课件
        await axios.post('http://localhost:5001/api/training-courseware', values);
        message.success('培训课件创建成功');
      }
      setIsModalVisible(false);
      fetchCoursewareList();
    } catch (error) {
      message.error(isEditMode ? '培训课件更新失败' : '培训课件创建失败');
      console.error('Error saving courseware:', error);
    }
  };

  // 删除课件
  const handleDelete = async (coursewareId) => {
    try {
      await axios.delete(`http://localhost:5001/api/training-courseware/${coursewareId}`);
      message.success('培训课件删除成功');
      fetchCoursewareList();
    } catch (error) {
      message.error('培训课件删除失败');
      console.error('Error deleting courseware:', error);
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
      width: 400, // 大约5cm
    },
    {
      title: '附件',
      dataIndex: 'attachment',
      key: 'attachment',
      width: 240, // 大约3cm
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: '培训对象',
      dataIndex: 'training_targets',
      key: 'training_targets',
      width: 480, // 大约6cm
      render: (targets) => {
        if (!targets || targets.length === 0) return '-';
        // 检查targets的结构，确保能正确获取name属性
        if (typeof targets === 'string') {
          return targets;
        } else if (Array.isArray(targets)) {
          return targets.map(target => {
            if (typeof target === 'object' && target.name) {
              return target.name;
            } else if (typeof target === 'string') {
              return target;
            } else if (typeof target === 'number') {
              // 尝试根据ID获取角色名称
              const role = roles.find(r => r.id === target);
              return role ? role.name : target;
            }
            return target;
          }).join(', ');
        }
        return '-';
      },
    },
    {
      title: '课件时长',
      dataIndex: 'course_duration',
      key: 'course_duration',
      width: 100,
    },
    {
      title: '启用状态',
      dataIndex: 'enabled_status',
      key: 'enabled_status',
      width: 100,
      render: (status) => {
        return status === 1 ? '启用' : '禁用';
      },
    },
    {
      title: '课件类型',
      dataIndex: 'course_type',
      key: 'course_type',
      width: 150,
      render: (courseType) => {
        if (!courseType) return '-';
        const type = evaluationTypes.find(t => t.id === courseType);
        return type ? type.evaluation_type : courseType;
      },
    },
    {
      title: '上传日期',
      dataIndex: 'upload_date',
      key: 'upload_date',
      width: 120,
      render: (date) => {
        if (!date) return '-';
        // 简化日期格式为年月日
        const dateObj = new Date(date);
        return dateObj.toISOString().split('T')[0];
      },
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
            title="确定要删除这个培训课件吗？"
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

  // 返回上一页
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="training-courseware-management">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button onClick={handleBack}>
            返回上一页
          </Button>
          <Title level={2} style={{ margin: 0 }}>培训课件管理</Title>
        </div>
        <Button type="primary" onClick={showAddModal}>
          新增培训课件
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={coursewareList}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑培训课件' : '新增培训课件'}
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
            name="courseware_name"
            label="课件名称"
            rules={[{ required: true, message: '请输入课件名称' }]}
          >
            <Input placeholder="请输入课件名称" />
          </Form.Item>
          
          <Form.Item
            name="attachment"
            label="附件"
            rules={[{ required: true, message: '请上传附件' }]}
          >
            <Upload
              name="file"
              action="http://localhost:5001/api/upload"
              maxCount={1}
              beforeUpload={(file) => {
                const suffix = file.name.split('.').pop().toLowerCase();
                const isJpgOrPng = suffix === 'jpg' || suffix === 'jpeg' || suffix === 'png';
                const isMp4 = suffix === 'mp4';
                const isPdf = suffix === 'pdf';
                const isLt50M = file.size / 1024 / 1024 < 50;

                if (!isJpgOrPng && !isMp4 && !isPdf) {
                  message.error('只支持JPG、MP4、PDF格式的文件');
                  return false;
                }
                if (!isLt50M) {
                  message.error('文件大小不能超过50MB');
                  return false;
                }
                return true;
              }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  // 上传成功后，设置attachment字段为文件URL
                  form.setFieldsValue({ attachment: info.file.response.url });
                  message.success(`${info.file.name} 上传成功`);
                } else if (info.file.status === 'error') {
                  message.error(`${info.file.name} 上传失败: ${info.file.response.error}`);
                }
              }}
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="training_targets"
            label="培训对象"
            rules={[{ required: true, message: '请选择培训对象' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择培训对象"
              style={{ width: '100%' }}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="version"
            label="版本"
            rules={[{ required: true, message: '请输入版本' }]}
          >
            <Input placeholder="请输入版本" />
          </Form.Item>
          
          <Form.Item
            name="author"
            label="作者"
            rules={[{ required: true, message: '请输入作者' }]}
          >
            <Input placeholder="请输入作者" />
          </Form.Item>
          
          <Form.Item
            name="course_duration"
            label="课件时长"
            initialValue="1h"
            rules={[{ required: true, message: '请选择课件时长' }]}
          >
            <Select placeholder="请选择课件时长">
              <Option value="0.5h">0.5h</Option>
              <Option value="1h">1h</Option>
              <Option value="2h">2h</Option>
              <Option value="3h">3h</Option>
              <Option value="4h">4h</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="enabled_status"
            label="启用状态"
            initialValue={1}
            rules={[{ required: true, message: '请选择启用状态' }]}
          >
            <Select placeholder="请选择启用状态">
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="course_type"
            label="课件类型"
          >
            <Select placeholder="请选择课件类型" allowClear>
              {evaluationTypes.map(type => (
                <Option key={type.id} value={type.id}>
                  {type.evaluation_type}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建课件'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Courseware;

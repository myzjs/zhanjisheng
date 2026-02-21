import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography, Upload, Select } from 'antd';
import { UploadOutlined, PlayCircleOutlined, FileImageOutlined, FilePdfOutlined, FullscreenOutlined, FullscreenExitOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../utils/auth.jsx';

const { Option } = Select;

const { Title } = Typography;

const Catalog = () => {
  const [coursewareList, setCoursewareList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCourseware, setCurrentCourseware] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 附件查看状态
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState('');
  const [startLearningTime, setStartLearningTime] = useState(null);
  const [currentCoursewareInfo, setCurrentCoursewareInfo] = useState(null);
  const [currentLearningRecordId, setCurrentLearningRecordId] = useState(null);
  
  // 获取当前用户信息
  const { user } = useAuth();

  // 获取学习目录列表
  const fetchCoursewareList = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (selectedCourseType) params.append('course_type', selectedCourseType);
      
      const url = `http://localhost:5001/api/training-courseware${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url);
      setCoursewareList(response.data);
    } catch (error) {
      message.error('获取学习目录失败');
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

  // 当课程类型筛选变化时，重新获取课程列表
  useEffect(() => {
    fetchCoursewareList();
  }, [selectedCourseType]);

  // 打开新增目录模态框
  const showAddModal = () => {
    setCurrentCourseware(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑目录模态框
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

  // 保存目录
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新目录
        await axios.put(`http://localhost:5001/api/training-courseware/${currentCourseware.id}`, values);
        message.success('学习目录更新成功');
      } else {
        // 创建目录
        await axios.post('http://localhost:5001/api/training-courseware', values);
        message.success('学习目录创建成功');
      }
      setIsModalVisible(false);
      fetchCoursewareList();
    } catch (error) {
      message.error(isEditMode ? '学习目录更新失败' : '学习目录创建失败');
      console.error('Error saving courseware:', error);
    }
  };

  // 删除目录
  const handleDelete = async (coursewareId) => {
    try {
      await axios.delete(`http://localhost:5001/api/training-courseware/${coursewareId}`);
      message.success('学习目录删除成功');
      fetchCoursewareList();
    } catch (error) {
      message.error('学习目录删除失败');
      console.error('Error deleting courseware:', error);
    }
  };

  // 开始学习
  const handleStartLearning = async (courseware) => {
    const attachmentUrl = courseware.attachment;
    if (!attachmentUrl) {
      message.error('该课程没有附件');
      return;
    }

    // 判断附件类型
    let type = '';
    if (attachmentUrl.toLowerCase().endsWith('.pdf')) {
      type = 'pdf';
    } else if (attachmentUrl.toLowerCase().endsWith('.mp4')) {
      type = 'mp4';
    } else if (attachmentUrl.toLowerCase().endsWith('.jpg') || 
               attachmentUrl.toLowerCase().endsWith('.jpeg') || 
               attachmentUrl.toLowerCase().endsWith('.png')) {
      type = 'image';
    } else {
      message.error('不支持的文件类型');
      return;
    }

    // 记录开始学习时间
    const startTime = new Date();
    setStartLearningTime(startTime);
    setCurrentCoursewareInfo(courseware);
    
    // 存储开始时间到学习记录表
    try {
      // 格式化时间
      const formatDate = (date) => date.toISOString().split('T')[0];
      const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5);
      
      // 准备学习记录数据
      const learningRecordData = {
        learning_courseware: courseware.id,
        learning_person: user?.name || '未知用户',
        learning_date: formatDate(startTime),
        start_time: formatTime(startTime),
        end_time: formatTime(startTime) // 暂时使用开始时间作为结束时间，后续会更新
      };
      
      // 发送学习记录到后端
      const response = await axios.post('http://localhost:5001/api/learning-records', learningRecordData);
      setCurrentLearningRecordId(response.data.id);
      console.log('学习开始记录保存成功');
    } catch (error) {
      console.error('保存学习开始记录失败:', error);
      message.error('保存学习开始记录失败');
    }
    
    setCurrentAttachment(attachmentUrl);
    setAttachmentType(type);
    setViewerModalVisible(true);
    
    // 延迟触发全屏，确保模态框已经渲染
    setTimeout(() => {
      // 尝试多次触发全屏，确保成功
      const tryFullscreen = (attempts = 0) => {
        if (attempts >= 5) return; // 最多尝试5次
        
        try {
          handleMaximize();
        } catch (error) {
          console.error('全屏失败，重试中...', error);
          setTimeout(() => tryFullscreen(attempts + 1), 100);
        }
      };
      
      tryFullscreen();
    }, 500); // 增加延迟时间，确保模态框完全渲染
  };

  // 处理模态框关闭，记录学习信息
  const handleViewerModalClose = async () => {
    if (startLearningTime && currentCoursewareInfo && currentLearningRecordId) {
      const endTime = new Date();
      try {
        // 计算学习时长（分钟）
        const durationMinutes = Math.round((endTime - startLearningTime) / (1000 * 60));
        
        // 格式化时间
        const formatDate = (date) => date.toISOString().split('T')[0];
        const formatTime = (date) => date.toTimeString().split(' ')[0].substring(0, 5);
        
        // 准备学习记录数据
        const learningRecordData = {
          learning_courseware: currentCoursewareInfo.id,
          learning_person: user?.name || '未知用户',
          learning_date: formatDate(startLearningTime),
          start_time: formatTime(startLearningTime),
          end_time: formatTime(endTime)
        };
        
        // 更新现有的学习记录
        await axios.put(`http://localhost:5001/api/learning-records/${currentLearningRecordId}`, learningRecordData);
        console.log('学习记录更新成功');
        
        // 如果学习时长不足30分钟，删除记录
        if (durationMinutes < 30) {
          await axios.delete(`http://localhost:5001/api/learning-records/${currentLearningRecordId}`);
          console.log('学习时长不足30分钟，记录已删除');
        }
      } catch (error) {
        console.error('处理学习记录失败:', error);
        message.error('处理学习记录失败');
      }
    }
    
    // 重置状态
    setViewerModalVisible(false);
    setStartLearningTime(null);
    setCurrentCoursewareInfo(null);
    setCurrentLearningRecordId(null);
  };

  // 禁用保存相关的键盘快捷键和操作
  useEffect(() => {
    if (viewerModalVisible) {
      // 禁用Ctrl+S等保存快捷键
      const handleKeyDown = (e) => {
        // 禁用Ctrl+S, Ctrl+P, Ctrl+Shift+I等快捷键
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'i')) {
          e.preventDefault();
          e.stopPropagation();
        }
        // 禁用F12开发者工具
        if (e.key === 'F12') {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // 禁用右键菜单
      const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      // 禁用页面保存事件
      const handleBeforeUnload = (e) => {
        // 可以添加一些清理逻辑
      };

      // 添加事件监听器
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // 清理事件监听器
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [viewerModalVisible]);

  // 处理视频全屏
  const handleMaximize = () => {
    if (attachmentType === 'mp4') {
      const videoElement = document.querySelector('video');
      if (videoElement) {
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen();
        } else if (videoElement.mozRequestFullScreen) {
          videoElement.mozRequestFullScreen();
        } else if (videoElement.webkitRequestFullscreen) {
          videoElement.webkitRequestFullscreen();
        } else if (videoElement.msRequestFullscreen) {
          videoElement.msRequestFullscreen();
        }
      }
    } else if (attachmentType === 'pdf') {
      const iframeElement = document.querySelector('iframe');
      if (iframeElement) {
        if (iframeElement.requestFullscreen) {
          iframeElement.requestFullscreen();
        } else if (iframeElement.mozRequestFullScreen) {
          iframeElement.mozRequestFullScreen();
        } else if (iframeElement.webkitRequestFullscreen) {
          iframeElement.webkitRequestFullscreen();
        } else if (iframeElement.msRequestFullscreen) {
          iframeElement.msRequestFullscreen();
        }
      }
    } else if (attachmentType === 'image') {
      const imgElement = document.querySelector('img');
      if (imgElement) {
        if (imgElement.requestFullscreen) {
          imgElement.requestFullscreen();
        } else if (imgElement.mozRequestFullScreen) {
          imgElement.mozRequestFullScreen();
        } else if (imgElement.webkitRequestFullscreen) {
          imgElement.webkitRequestFullscreen();
        } else if (imgElement.msRequestFullscreen) {
          imgElement.msRequestFullscreen();
        }
      }
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
      title: '目录名称',
      dataIndex: 'courseware_name',
      key: 'courseware_name',
    },
    {
      title: '附件',
      dataIndex: 'attachment',
      key: 'attachment',
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
      title: '课程时长',
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
      title: '资料类型',
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
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => handleStartLearning(record)}>
            开始学习
          </Button>
        </Space>
      ),
    },

  ];

  return (
    <div className="learning-catalog-management">
      <Title level={2}>学习目录</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <Select
          placeholder="资料类型"
          style={{ width: 200 }}
          value={selectedCourseType || undefined}
          onChange={setSelectedCourseType}
          allowClear
        >
          <Option value="">全选</Option>
          {evaluationTypes.map(type => (
            <Option key={type.id} value={type.id}>
              {type.evaluation_type}
            </Option>
          ))}
        </Select>
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
        title={isEditMode ? '编辑学习目录' : '新增学习目录'}
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
            label="目录名称"
            rules={[{ required: true, message: '请输入目录名称' }]}
          >
            <Input placeholder="请输入目录名称" />
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
            label="课程时长"
            initialValue="1h"
            rules={[{ required: true, message: '请选择课程时长' }]}
          >
            <Select placeholder="请选择课程时长">
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
            label="资料类型"
          >
            <Select placeholder="请选择资料类型" allowClear>
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
                {isEditMode ? '保存修改' : '创建目录'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 附件查看模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', position: 'relative' }}>
            <span>{currentCoursewareInfo?.courseware_name || '学习内容'}</span>
            <div style={{ position: 'absolute', right: '0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button 
                type="text" 
                icon={<FullscreenOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMaximize();
                }}
                style={{ 
                  padding: '4px',
                  fontSize: '14px',
                  height: '24px',
                  minWidth: '24px'
                }}
                title="全屏"
              />
              <CloseOutlined onClick={handleViewerModalClose} style={{ cursor: 'pointer' }} />
            </div>
          </div>
        }
        open={viewerModalVisible}
        onCancel={handleViewerModalClose}
        footer={null}
        width={950}
        height={750}
        style={{ 
          padding: '0',
          borderRadius: '2px',
          border: '0.1cm solid #d9d9d9',
          zIndex: 9999
        }}
        bodyStyle={{
          padding: '0',
          margin: '0',
          overflow: 'hidden'
        }}
        closeIcon={null}
        modalRender={(modal) => (
          <div style={{ overflow: 'hidden', borderRadius: '2px' }}>
            {modal}
          </div>
        )}
      >
        <div style={{ width: '100%', height: '700px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* 水印层 */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            pointerEvents: 'none', 
            zIndex: 10
          }}>
            <div style={{ 
              fontSize: '24px', 
              color: 'rgba(0, 0, 0, 0.1)', 
              fontWeight: 'bold', 
              transform: 'rotate(-45deg)', 
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              公司内部资料，注意保密
              <br />
              {user?.name || '未知用户'}
            </div>
          </div>
          
          {/* 内容层 */}
          <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
            {attachmentType === 'pdf' && (
              <div 
                style={{ width: '100%', height: '100%' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <iframe
                  src={currentAttachment + '#toolbar=0'}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Viewer"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
            {attachmentType === 'mp4' && (
              <div 
                style={{ width: '100%', height: '100%' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <video
                  src={currentAttachment}
                  controls
                  style={{ width: '100%', height: '100%' }}
                  title="Video Player"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
            {attachmentType === 'image' && (
              <div 
                style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={currentAttachment}
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                  alt="Image"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Catalog;
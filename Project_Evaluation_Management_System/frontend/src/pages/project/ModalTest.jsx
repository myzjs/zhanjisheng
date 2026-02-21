import { useState } from 'react';
import { Button, Modal } from 'antd';

const ModalTest = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenModal = () => {
    console.log('Opening modal...');
    setModalVisible(true);
    console.log('Modal visible:', modalVisible);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Modal Test</h1>
      <Button type="primary" onClick={handleOpenModal}>
        Open Modal
      </Button>
      
      <Modal
        title="Test Modal"
        open={modalVisible}
        onOk={handleCloseModal}
        onCancel={handleCloseModal}
      >
        <p>This is a test modal content.</p>
      </Modal>
    </div>
  );
};

export default ModalTest;
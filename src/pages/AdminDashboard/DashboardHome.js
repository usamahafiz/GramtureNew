import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Upload, Button, Select, message, Card } from 'antd';
import { UploadOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { storage, fireStore } from '../../firebase/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs , doc, setDoc, getDoc, } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "../../assets/css/dashboardhome.css";

const { Option } = Select;

const ResponsiveForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [draftId, setDraftId] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const querySnapshot = await getDocs(collection(fireStore, 'classes'));
      const fetchedClasses = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setClasses(fetchedClasses);
    };


  const fetchDraft = async () => {
    const draftRef = doc(fireStore, 'drafts', 'user_draft');
    const draftSnap = await getDoc(draftRef);
    if (draftSnap.exists()) {
      const draftData = draftSnap.data();
      form.setFieldsValue(draftData);
      setDescription(draftData.description || '');
      setDraftId(draftSnap.id);
      setFileList(draftData.file || []);
    }
  };

  fetchClasses();
  fetchDraft();
}, [form]);

  const onFinish = async (values) => {
    const { topic, date, class: selectedClasses, category, subCategory, file } = values;

    setUploading(true);
    let fileURL = [];

    if (file && file.length > 0) {
      for (const fileItem of file) {
        const uniqueFileName = `${Date.now()}-${fileItem.name}`;
        const storageRef = ref(storage, `uploads/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, fileItem.originFileObj);

        try {
          await new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
              },
              (error) => {
                console.error('Upload failed:', error);
                message.error('File upload failed.');
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                fileURL.push(downloadURL);
                resolve();
              }
            );
          });
        } catch (error) {
          setUploading(false);
          return;
        }
      }
    }

    try {
      await addDoc(collection(fireStore, 'topics'), {
        topic: topic || '',
        date: date ? date.format('YYYY-MM-DD') : '',
        class: selectedClasses.join(', '),
        category: category || '',
        subCategory: subCategory || '',
        description: description || '',
        fileURL,
        timestamp: new Date(),
      });

      message.success('Topic created successfully!');
    } catch (e) {
      console.error('Error adding document:', e);
      message.error('Failed to save topic.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddClass = async () => {
    if (newClass && !classes.some(cls => cls.name === newClass)) {
      setAddingClass(true);
      try {
        const docRef = await addDoc(collection(fireStore, 'classes'), { name: newClass });
        setClasses([...classes, { id: docRef.id, name: newClass }]);
        setNewClass('');
        message.success(`Class ${newClass} added successfully!`);
      } catch (e) {
        console.error('Error adding class:', e);
        message.error('Failed to add class.');
      } finally {
        setAddingClass(false);
      }
    }
  };

  const saveAsDraft = async () => {
    try {
      const values = await form.validateFields();
      
      // Remove file objects since Firestore does not support File type
      const { file, ...dataToSave } = values;
  
      await setDoc(doc(fireStore, 'drafts', 'user_draft'), {
        ...dataToSave,
        file: file ? file.map(f => f.name) : [],  // Store only file names or empty array
        description,
        date: values.date ? values.date.format('YYYY-MM-DD') : '',
      });
  
      message.success('Draft saved successfully!');
    } catch (e) {
      console.error('Error saving draft:', e);
      message.error('Failed to save draft.');
    }
  };
  
  

  const quillModules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ size: [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      [{ 'direction': 'rtl' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      ['clean']
    ],
  };

  return (
    <div className="form-container mt-2">
      <h1 className="text-center mb-2">Create Topic</h1>
      <Card
        bordered={false}
        style={{
          margin: '20px auto',
          boxShadow: '0 12px 22px rgba(0, 0, 0, 0.2)',
          borderRadius: '10px',
        }}
      >
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item label="Topic Name" name="topic">
            <Input placeholder="Enter topic name" />
          </Form.Item>

          <Form.Item label="Category" name="category">
            <Input placeholder="Enter category" />
          </Form.Item>

          <Form.Item label="SubCategory" name="subCategory">
            <Input placeholder="Enter subcategory" />
          </Form.Item>

          <Form.Item label="Class" name="class" rules={[{ required: true, message: 'Please select a class!' }]}>
            <Select
              mode="multiple"
              placeholder="Select class(es)"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                    <Input
                      style={{ flex: 'auto' }}
                      placeholder="Add new class"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      onPressEnter={handleAddClass}
                    />
                    <Button
                      type="primary"
                      icon={addingClass ? <LoadingOutlined /> : <PlusOutlined />}
                      onClick={handleAddClass}
                    >
                      {addingClass ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </>
              )}
            >
              {classes.map((classOption) => (
                <Option key={classOption.id} value={classOption.name}>
                  {classOption.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Date" name="date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <ReactQuill value={description} onChange={setDescription} theme="snow" placeholder="Enter the description" modules={quillModules} />
          </Form.Item>

          <Form.Item label="Upload File" name="file" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}>
            <Upload name="file" beforeUpload={() => false} accept=".jpg,.jpeg,.png,.pdf" multiple>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block disabled={uploading}>
              {uploading ? <LoadingOutlined /> : 'Publish'}
            </Button>
          </Form.Item>
          <Form.Item>
            <Button type="primary" block onClick={saveAsDraft}>
            {uploading ? <LoadingOutlined /> : 'Save as draft'}
            </Button>
          </Form.Item>

          <Form.Item>
            <Button type="default" block onClick={() => navigate('/ManageProducts')}>
              Manage Topics
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResponsiveForm;
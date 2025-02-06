import React, { useState, useEffect } from 'react';
import { Table, Button, Popconfirm, message, Modal, Form, Input, Select, DatePicker, Upload } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { fireStore } from '../../firebase/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import moment from 'moment';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DescriptionRenderer from '../../components/DescriptionRenderer';


const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const storage = getStorage();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(fireStore, 'topics'), orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    } catch (error) {
      message.error('Failed to fetch products.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(fireStore, 'topics', id));
      message.success('Product deleted successfully!');
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (error) {
      message.error('Failed to delete product.');
      console.error(error);
    }
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    setDescription(record.description || '');
    form.setFieldsValue({
      topic: record.topic,
      class: record.class,
      category: record.category,
      subCategory: record.subCategory,
      description: record.description || '',
      date: record.date ? moment(record.date) : null,
    });
    setIsModalVisible(true);
    setFileList([]);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setDescription('');
    form.resetFields();
    setFileList([]);
    setLoading(false);
  };

  const uploadFile = async () => {
    if (fileList.length > 0) {
      const file = fileList[0];
      const storageRef = ref(storage, `files/${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
    return null;
  };

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const fileUrl = await uploadFile();
      const updatedValues = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : '',
        description: description,
        timestamp: serverTimestamp(),
      };

      if (fileUrl) {
        updatedValues.fileURL = fileUrl;
      } else if (editingProduct.fileURL) {
        updatedValues.fileURL = editingProduct.fileURL;
      }

      await updateDoc(doc(fireStore, 'topics', editingProduct.id), updatedValues);
      message.success('Product updated successfully!');
      handleModalClose();
      fetchProducts();
    } catch (error) {
      message.error('Failed to update product.');
      console.error(error);
      setLoading(false);
    }
  };

  

  const columns = [
    { title: 'Topic', dataIndex: 'topic', key: 'topic' },
    { title: 'Class', dataIndex: 'class', key: 'class' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'SubCategory', dataIndex: 'subCategory', key: 'subCategory' },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description) => <DescriptionRenderer description={description} />,
    },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'File',
      dataIndex: 'fileURL',
      key: 'fileURL',
      render: (fileURL) => {
        if (!fileURL || (Array.isArray(fileURL) && fileURL.length === 0)) {
          return 'No File'; // Show 'No File' when no URLs exist
        }
    
        const urls = Array.isArray(fileURL) ? fileURL : [fileURL]; // Ensure it's an array
        return urls.map((url, index) => (
          <div key={index}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Download File {index + 1}
            </a>
          </div>
        ));
      },
    

    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} style={{ margin: 3, color: 'green' }} onClick={() => handleEdit(record)} />
          <Popconfirm title="Are you sure to delete this product?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button style={{ color: 'red', margin: 3 }} icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="container">
      <h2 className='text-center py-5'>Manage Products</h2>
      <Table dataSource={products} columns={columns} rowKey="id" bordered />
      <Modal title="Edit Product" visible={isModalVisible} onCancel={handleModalClose} footer={null} width={800} className="responsive-modal">
        <Form form={form} layout="vertical" onFinish={handleUpdate} className="responsive-form">
            <Form.Item
              label="Topic"
              name="topic"
              rules={[{ required: true, message: 'Please enter the topic!' }]}>
              <Input placeholder="Enter topic" />
            </Form.Item>

            <Form.Item
              label="Class"
              name="class"
              rules={[{ required: true, message: 'Please select the class!' }]}>
              <Select placeholder="Select class">
                <Select.Option value="10">10</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please enter the category!' }]}>
              <Input placeholder="Enter category" />
            </Form.Item>

            <Form.Item
              label="SubCategory"
              name="subCategory"
              rules={[{ required: true, message: 'Please enter the subcategory!' }]}>
              <Input placeholder="Enter subcategory" />
            </Form.Item>

            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select the date!' }]}>
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="Select date and time"
              />
            </Form.Item>
            <Form.Item label="Description"> <ReactQuill value={description} onChange={setDescription} theme="snow" className="responsive-quill" /> </Form.Item>
               <Form.Item label="Upload File"> <Upload fileList={fileList} beforeUpload={(file) => { setFileList([file]); return false; }} maxCount={1} className="responsive-upload"> <Button>Select File</Button> </Upload> </Form.Item>
            <Form.Item> <Button type="primary" htmlType="submit" block loading={loading}>Update</Button> </Form.Item>


          </Form>
      </Modal>
    </div>
  );
};

export default ManageProducts;









// import React, { useState, useEffect } from 'react';
// import { Table, Button, Popconfirm, message, Modal, Form, Input, Select, DatePicker, Upload } from 'antd';
// import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
// import { collection, getDocs, deleteDoc, doc, updateDoc , orderBy, serverTimestamp } from 'firebase/firestore';
// import { fireStore } from '../../firebase/firebase';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import moment from 'moment';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
// import DescriptionRenderer from '../../components/DescriptionRenderer'

// const ManageProducts = () => {
//   const [products, setProducts] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [fileList, setFileList] = useState([]);
//   const [form] = Form.useForm();
//   const [description, setDescription] = useState('');
//   const [loading, setLoading] = useState(false);
//   const storage = getStorage();

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       const querySnapshot = await getDocs(collection(fireStore, 'topics'),  orderBy('timestamp', 'asc'));
//       const productList = querySnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setProducts(productList);
//     } catch (error) {
//       message.error('Failed to fetch products.');
//       console.error(error);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteDoc(doc(fireStore, 'topics', id));
//       message.success('Product deleted successfully!');
//       setProducts((prev) => prev.filter((product) => product.id !== id));
//     } catch (error) {
//       message.error('Failed to delete product.');
//       console.error(error);
//     }
//   };

//   const handleEdit = (record) => {
//     setEditingProduct(record);
//     setDescription(record.description || ''); // Load existing description with formatting
//     form.setFieldsValue({
//       topic: record.topic,
//       class: record.class,
//       category: record.category,
//       subCategory: record.subCategory,
//       date: moment(record.date),
//       description: record.description || '',
//     });
//     setIsModalVisible(true);
//     setFileList([]);
//   };

//   const handleModalClose = () => {
//     setIsModalVisible(false);
//     setDescription('');
//     form.resetFields();
//     setFileList([]);
//   };

//   const uploadFile = async () => {
//     if (fileList.length > 0) {
//       const file = fileList[0];
//       const storageRef = ref(storage, `files/${file.name}`);
//       await uploadBytes(storageRef, file);
//       const downloadURL = await getDownloadURL(storageRef);
//       return downloadURL;
//     }
//     return null;
//   };

//   const handleUpdate = async (values) => {
//     try {
//       const fileUrl = await uploadFile();

//       // Create updatedValues without the fileURL field initially
//       const updatedValues = {
//         ...values,
//         date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : '',
//         description: description, // Save rich-text HTML description
//         timestamp: serverTimestamp(),
//       };

//       // Only add the fileURL field if there's a new file or existing file
//       if (fileUrl) {
//         updatedValues.fileURL = fileUrl;
//       } else if (editingProduct.fileURL) {
//         updatedValues.fileURL = editingProduct.fileURL;
//       }

//       const productRef = doc(fireStore, 'topics', editingProduct.id);
//       await updateDoc(productRef, updatedValues);
//       message.success('Product updated successfully!');
//       handleModalClose();
//       fetchProducts();
//     } catch (error) {
//       message.error('Failed to update product.');
//       console.error(error);
//     }
//   };

//   const renderDescription = (description) => {
//     if (!description) return 'No description available';
//     const words = description.split(' ');
//     const truncatedDescription = words.slice(0, 10).join(' ') + (words.length > 30 ? '...' : '');
//     return <span dangerouslySetInnerHTML={{ __html: truncatedDescription }} />;
//   };

//   const columns = [
//     {
//       title: 'Topic',
//       dataIndex: 'topic',
//       key: 'topic',
//     },
//     {
//       title: 'Class',
//       dataIndex: 'class',
//       key: 'class',
//     },
//     {
//       title: 'Category',
//       dataIndex: 'category',
//       key: 'category',
//     },
//     {
//       title: 'SubCategory',
//       dataIndex: 'subCategory',
//       key: 'subCategory',
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (description) => <DescriptionRenderer description={description} />,
//     },
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//     },
//     {
//       title: 'File',
//       dataIndex: 'fileURL',
//       key: 'fileURL',
//       render: (text) => text ? (
//         <a href={text} target="_blank" rel="noopener noreferrer">
//           Download File
//         </a>
//       ) : 'No File',
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       render: (text, record) => (
//         <>
//           <Button
//             className='m-1'
//             icon={<EditOutlined />}
//             style={{ marginRight: 8, color: 'green' }}
//             onClick={() => handleEdit(record)}
//           />
//           <Popconfirm
//             title="Are you sure to delete this product?"
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button className='m-1' style={{color: 'red'}} icon={<DeleteOutlined />} danger />
//           </Popconfirm>
//         </>
//       ),
//     },
//   ];

//   return (
//     <div className="container">
//       <div style={{ padding: '20px' }}>
//         <h2 className='text-center py-5'>Manage Topics</h2>
//         <div className="table-responsive">
//           <Table 
//             dataSource={products}
//             columns={columns}
//             rowKey="id"
//             bordered
//           />
//         </div>

//         <Modal
//           title="Edit Product"
//           visible={isModalVisible}
//           onCancel={handleModalClose}
//           footer={null}
//           width={1200}
//         >
//           <Form
//             form={form}
//             layout="vertical"
//             onFinish={handleUpdate}
//             initialValues={{ description: editingProduct?.description || '' }}
//           >
//             <Form.Item
//               label="Topic"
//               name="topic"
//               rules={[{ required: true, message: 'Please enter the topic!' }]}>
//               <Input placeholder="Enter topic" />
//             </Form.Item>

//             <Form.Item
//               label="Class"
//               name="class"
//               rules={[{ required: true, message: 'Please select the class!' }]}>
//               <Select placeholder="Select class">
//                 <Select.Option value="10">10</Select.Option>
//               </Select>
//             </Form.Item>

//             <Form.Item
//               label="Category"
//               name="category"
//               rules={[{ required: true, message: 'Please enter the category!' }]}>
//               <Input placeholder="Enter category" />
//             </Form.Item>

//             <Form.Item
//               label="SubCategory"
//               name="subCategory"
//               rules={[{ required: true, message: 'Please enter the subcategory!' }]}>
//               <Input placeholder="Enter subcategory" />
//             </Form.Item>

//             <Form.Item
//               label="Date"
//               name="date"
//               rules={[{ required: true, message: 'Please select the date!' }]}>
//               <DatePicker
//                 showTime
//                 format="YYYY-MM-DD HH:mm:ss"
//                 placeholder="Select date and time"
//               />
//             </Form.Item>

//             <Form.Item label="Description">
//               <ReactQuill
//                 value={description}
//                 onChange={setDescription}
//                 theme="snow"
//                 modules={{
//                   toolbar: [
//                     [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
//                     [{ size: [] }],
//                     [{ 'list': 'ordered' }, { 'list': 'bullet' }],
//                     ['bold', 'italic', 'underline', 'strike', 'blockquote'],
//                     [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
//                     [{ 'align': [] }],
//                     ['link', 'image'],
//                     [{ 'direction': 'rtl' }], // Support for Right-to-Left languages
//                     [{ 'script': 'sub' }, { 'script': 'super' }], // Superscript/Subscript
//                     ['clean'] // Remove formatting button
//                   ],
//                 }}
//                 style={{ height: '200px', marginBottom: '50px' }}
//               />
//             </Form.Item>

//             <Form.Item 
//               label="File"
//               extra={editingProduct?.fileURL ? (
//                 <a href={editingProduct.fileURL} target="_blank" rel="noopener noreferrer">
//                   Current File
//                 </a>
//               ) : 'No file uploaded'}>
//               <Upload
//                 fileList={fileList}
//                 beforeUpload={(file) => {
//                   setFileList([file]);
//                   return false;
//                 }}
//                 maxCount={1}
//                 onRemove={() => setFileList([])}
//               >
//                 <Button>Select File</Button>
//               </Upload>
//             </Form.Item>

//             <Form.Item> <Button type="primary" htmlType="submit" block loading={loading}>Update</Button> </Form.Item>

//           </Form>
//         </Modal>
//       </div>
//     </div>
//   );
// };

// export default ManageProducts;
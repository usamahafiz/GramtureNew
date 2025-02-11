import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { message, Spin } from 'antd';
import { getDocs, collection } from 'firebase/firestore';
import { fireStore } from '../firebase/firebase';
import { FaReply, FaShareAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import "../assets/css/description.css"; 
import { addDoc, doc, updateDoc } from 'firebase/firestore';

export default function Description() {
  const { subCategory, topicId } = useParams(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ name: '', email: '', comment: '' });
  const [newReply, setNewReply] = useState('');
  const [replyingToIndex, setReplyingToIndex] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchComments();
    fetchAllTopics();
  }, [subCategory, topicId]); 

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(fireStore, 'topics'));
      const productList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((product) => product.subCategory === subCategory && product.id === topicId);
      setProducts(productList);
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch products.');
      console.error(error);
    }
  };

  const fetchComments = async () => {
    try {
      const commentsRef = collection(fireStore, 'comments', subCategory, 'topicComments');
      const querySnapshot = await getDocs(commentsRef);
      const commentsList = querySnapshot.docs.map((doc) => doc.data());
      setComments(commentsList);
    } catch (error) {
      message.error('Failed to fetch comments.');
      console.error(error);
    }
  };

  const fetchAllTopics = async () => {
    try {
      const querySnapshot = await getDocs(collection(fireStore, 'topics'));
      const topicsList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((topic) => topic.subCategory === subCategory)
        .sort((a, b) => a.timestamp - b.timestamp);

      setAllTopics(topicsList);
      const currentTopicIdx = topicsList.findIndex((topic) => topic.id === topicId);
      setCurrentTopicIndex(currentTopicIdx);
    } catch (error) {
      message.error('Failed to fetch topics.');
      console.error(error);
    }
  };

  
  const handleCommentChange = (e) => {
    setNewComment({
      ...newComment,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitComment = async () => {
    try {
      const docRef = await addDoc(collection(fireStore, 'comments', subCategory, 'topicComments'), newComment);
      setComments([...comments, { id: docRef.id, ...newComment }]);
      setNewComment({ name: '', email: '', comment: '' });
      message.success('Comment added successfully!');
    } catch (error) {
      message.error('Failed to add comment.');
      console.error(error);
    }
  };

  const handleReplyChange = (e) => {
    setNewReply(e.target.value);
  };

  const handleSubmitReply = async (commentIndex) => {
    if (newReply.trim()) {
      const updatedComments = [...comments];
      const commentRef = doc(fireStore, 'comments', subCategory, 'topicComments', comments[commentIndex].id);
      await updateDoc(commentRef, {
        replies: [...(comments[commentIndex].replies || []), newReply],
      });
      updatedComments[commentIndex].replies = [...(updatedComments[commentIndex].replies || []), newReply];
      setComments(updatedComments);
      setNewReply('');
      setReplyingToIndex(null);
    } else {
      message.warning('Please enter a reply.');
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && window.location) {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: 'Check out this article!',
          url,
        }).catch((error) => {
          console.error('Error sharing:', error);
          copyLinkToClipboard(url);
        });
      } else {
        copyLinkToClipboard(url);
      }
    } else {
      message.error('Unable to get the current URL.');
      console.error('window.location is not available.');
    }
  };

  const copyLinkToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('Link copied to clipboard!');
    }).catch((error) => {
      message.error('Failed to copy the link.');
      console.error(error);
    });
  };

  const renderFilePreview = (file) => {
    const fileURL = file.url;
  
    if (!fileURL) {
      return <p>No file URL available</p>;
    }
  
    return (
      <button
        onClick={() => window.open(fileURL, '_blank')} 
        style={{
          padding: '10px 20px',
          backgroundColor: '#0073e6',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        Open File
      </button>
    );
  };


  const getNextTopic = () => {
    if (currentTopicIndex === null || currentTopicIndex + 1 >= allTopics.length) return null;
    return allTopics[currentTopicIndex + 1];
  };

  const getPrevTopic = () => {
    if (currentTopicIndex === null || currentTopicIndex - 1 < 0) return null;
    return allTopics[currentTopicIndex - 1];
  };

  return (
    <div className="description-container">
      {loading && (
        <div className="loader-overlay">
          <Spin size="large" />
        </div>
      )}
      {products.length > 0 && (
        <>
          <h3 className="page-title">{subCategory}</h3>
          <h2>{products[0].topic}</h2>

          {products.map((product) => (
            <article key={product.id} className="product-article">
              <div className="product-description" dangerouslySetInnerHTML={{ __html: product.description }} />
            </article>
          ))}

          <div className="topic-navigation">
            {getPrevTopic() && getPrevTopic().subCategory === subCategory && getPrevTopic().class === products[0].class && (
             <Link 
             to={`/description/${subCategory}/${getPrevTopic().id}`} 
             className="prev-button"
             style={{
               display: 'flex',
               alignItems: 'center',
               marginBottom: '20px',
               fontSize: '18px',
               fontWeight: 'bold',
               textDecoration: 'none',
               color: '#0073e6',
             }}
           >
             <FaChevronLeft className="nav-icon" /> Previous Topic: {getPrevTopic().topic}
           </Link>
           
            )}

            {getNextTopic() && getNextTopic().subCategory === subCategory && getNextTopic().class === products[0].class && (
              <Link 
              to={`/description/${subCategory}/${getNextTopic().id}`} 
              className="next-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                textDecoration: 'none',
                color: '#0073e6',
              }}
            >
              Next Topic: {getNextTopic().topic} <FaChevronRight className="nav-icon" />
            </Link>
            
            )}
          </div>

             <button
            onClick={handleShare}
            style={{
              padding: '10px 25px',
              backgroundColor: '#FF0000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '30px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'auto',
              margin: '0 auto',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <FaShareAlt style={{ marginRight: '10px', fontSize: '18px' }} />
            Share this Article
          </button>

          <div className="comment-section">
            <h3 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              Leave a Comment
            </h3>

            <div className="comment-form">
              <input
                type="text"
                name="name"
                value={newComment.name}
                onChange={handleCommentChange}
                placeholder="Your Name"
                className="comment-input"
              />
              <input
                type="email"
                name="email"
                value={newComment.email}
                onChange={handleCommentChange}
                placeholder="Your Email"
                className="comment-input"
              />
              <textarea
                name="comment"
                value={newComment.comment}
                onChange={handleCommentChange}
                placeholder="Your Comment"
                rows="5"
                className="comment-textarea"
              />
              <button
                onClick={handleSubmitComment}
                className="submit-btn"
              >
                {loading ? <Spin size="small" /> : 'Submit Comment'}
              </button>
            </div>

            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header">
                    <strong>{comment.name}</strong>
                    <div>
                      <FaReply
                        onClick={() => setReplyingToIndex(index)}
                        style={{
                          cursor: 'pointer',
                          marginLeft: '10px',
                        }}
                      />
                    </div>
                  </div>
                  <p>{comment.comment}</p>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies">
                      {comment.replies.map((reply, idx) => (
                        <p key={idx} className="reply-text">{reply}</p>
                      ))}
                    </div>
                  )}
                  {replyingToIndex === index && (
                    <div className="reply-form">
                      <textarea
                        value={newReply}
                        onChange={handleReplyChange}
                        placeholder="Write a reply..."
                        rows="3"
                        className="reply-textarea"
                      />
                      <button
                        onClick={() => handleSubmitReply(index)}
                        className="submit-btn"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No comments yet.</p>
            )}
          </div>

        </>

      )}
    </div>
  );
}


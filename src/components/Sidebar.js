import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';
import { FaBars, FaTimes } from 'react-icons/fa';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';

import '../assets/css/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { fireStore } from '../firebase/firebase';

const Sidebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [dropdownData, setDropdownData] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openCategory, setOpenCategory] = useState({});

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const q = query(collection(fireStore, 'topics'), orderBy('timestamp', 'asc'));

        const querySnapshot = await getDocs(q);
        const data = {};

        querySnapshot.forEach((doc) => {
          const { class: className, category, subCategory, timestamp } = doc.data();
          if (!data[className]) {
            data[className] = {};
          }
          if (!data[className][category]) {
            data[className][category] = new Set();
          }
          data[className][category].add(subCategory);
        });

        const formattedData = Object.keys(data).map((classKey) => ({
          title: classKey,
          content: Object.keys(data[classKey]).map((categoryKey) => ({
            category: categoryKey,
            subCategories: Array.from(data[classKey][categoryKey]),
          })),
        }));

        setDropdownData(formattedData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const toggleCategory = (mainIndex, categoryIndex) => {
    const key = `${mainIndex}-${categoryIndex}`;
    setOpenCategory((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const filteredClasses = dropdownData.filter((dropdown) =>
    dropdown.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homepage d-flex">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'd-block' : 'd-none'} d-lg-block`}>
        {/* Collapse Button for Small Screens */}
        <div className="d-lg-none mb-3" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <FaTimes className="icon" /> : <FaBars className="icon" />}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control mb-3 search-bar"
        />

        {/* Dropdown Content */}
        <div className="tags-list">
          {filteredClasses.map((dropdown, index) => (
            <div key={index} className="class-item">
              <div
                className="d-flex justify-content-between align-items-center dropdown-header"
                onClick={() => toggleDropdown(index)}
              >
                <h6 className="dropdown-title">{dropdown.title}</h6>
                {openDropdown === index ? <MdExpandLess /> : <MdExpandMore />}
              </div>
              <Collapse in={openDropdown === index}>
                <div className="mt-2">
                  {dropdown.content.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="mb-3">
                      <div
                        className="d-flex justify-content-between align-items-center category-header"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(index, categoryIndex);
                        }}
                      >
                        <h6 className="category-title">{category.category}</h6>
                        {openCategory[`${index}-${categoryIndex}`] ? <BsChevronUp /> : <BsChevronDown />}
                      </div>
                      <Collapse in={openCategory[`${index}-${categoryIndex}`]}>
                        <ul className="list-unstyled mt-2 pl-4">
                          {category.subCategories.map((subCategory, subIdx) => (
                            <li key={subIdx} className="py-1">
                              <Link
                                to={`/description/${subCategory}`}
                                className="sub-category-link"
                                onClick={handleLinkClick}
                              >
                                {subCategory}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </Collapse>
                    </div>
                  ))}
                </div>
              </Collapse>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="content flex-grow-1">
        {/* Mobile Sidebar Toggle Button */}
        <div className="d-lg-none p-3" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <FaTimes className="icon" /> : <FaBars className="icon" />}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

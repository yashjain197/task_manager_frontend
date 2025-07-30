import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';  // Import for redirection
import { getTasks, createTask, updateTask, deleteTask, connectWebSocket, fetchUsers } from '../api';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);  // New state for fetched users
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);  // Separate loading for users
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', due_date_start: '', due_date_end: '', assigned_to: '' });
  const [formData, setFormData] = useState({ title: '', description: '', status: 'PENDING', priority: 'LOW', due_date: '', assigned_to_id: '' });
  const [ws, setWs] = useState(null);

  const userRole = localStorage.getItem('userRole');
  const permissions = JSON.parse(localStorage.getItem('permissions')) || [];
  const hasManageTasks = permissions.some(p => p.permission_name === 'manage_tasks');
  const hasUpdateStatus = permissions.some(p => p.permission_name === 'update_task_status');
  const hasViewTasks = permissions.some(p => p.permission_name === 'view_tasks') || userRole === 'Admin';
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();  // For redirecting to login

  useEffect(() => {
    fetchTasks();
    fetchUsersList();  // Fetch users on mount
    const socket = connectWebSocket();
    setWs(socket);

    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'task_update') {
          toast.info('Task updated in real-time!');
          fetchTasks();  // Refresh list
        } else if (data.type === 'task_delete') {
          toast.info('Task deleted in real-time!');
          setTasks(prev => prev.filter(t => t.id !== data.task_id));
        }
      };
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const fetchUsersList = async () => {
    setUsersLoading(true);
    try {
      const res = await fetchUsers();  // Optionally add params like { role: 'User' }
      if (res.data.success) {
        setUsers(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error('Failed to fetch users – check token or backend');
    }
    setUsersLoading(false);
  };

  const fetchTasks = async () => {
    if (!hasViewTasks) {
      toast.error('No permission to view tasks');
      return;
    }
    setLoading(true);
    try {
      const res = await getTasks(filters);
      if (res.data.success) {
        setTasks(res.data.data);
      } else {
        toast.error(res.data.message);
        console.error('Fetch tasks error:', res.data.message);  // Debug log
      }
    } catch (err) {
      toast.error('Failed to fetch tasks');
      console.error('Fetch tasks failed:', err);  // Debug log
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    if (!hasManageTasks) {
      toast.error('No permission to create tasks');
      return;
    }
    setLoading(true);
    try {
      const res = await createTask(formData);
      if (res.data.success) {
        toast.success('Task created!');
        // Optimistic update: Add the new task to local state immediately
        setTasks(prev => [...prev, res.data.data]);
        setShowCreateModal(false);
        // Still fetch from server to sync (e.g., if WebSocket delays)
        fetchTasks();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to create task');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!hasManageTasks && !hasUpdateStatus) {
      toast.error('No permission to update tasks');
      return;
    }
    // If not admin/manage_tasks, restrict to status only
    const updateData = hasManageTasks ? formData : { status: formData.status };
    setLoading(true);
    try {
      const res = await updateTask(selectedTask.id, updateData);
      if (res.data.success) {
        toast.success('Task updated!');
        setShowUpdateModal(false);
        fetchTasks();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!hasManageTasks) {
      toast.error('No permission to delete tasks');
      return;
    }
    if (window.confirm('Delete this task?')) {
      setLoading(true);
      try {
        const res = await deleteTask(id);
        if (res.data.success) {
          toast.success('Task deleted!');
          fetchTasks();
        } else {
          toast.error(res.data.message);
        }
      } catch (err) {
        toast.error('Failed to delete task');
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();  // Clear all auth data
    if (ws) ws.close();  // Close WebSocket
    toast.success('Logged out successfully');
    navigate('/');  // Redirect to login
  };

  const openCreateModal = () => {
    setFormData({ title: '', description: '', status: 'PENDING', priority: 'LOW', due_date: '', assigned_to_id: '' });  // Reset formData
    setShowCreateModal(true);
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',  // Format for input
      assigned_to_id: task.assigned_to_id || ''
    });
    setShowUpdateModal(true);
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Task Manager Dashboard</h2>
        <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>  {/* New logout button */}
      </div>
      {hasManageTasks && <Button variant="primary" onClick={openCreateModal} className="mb-3">Create Task</Button>}

      {/* Filters */}
      <Form onSubmit={applyFilters} className="mb-4">
        <Form.Group className="d-flex gap-3">
          <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Select Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Form.Select>
          <Form.Select name="priority" value={filters.priority} onChange={handleFilterChange}>
            <option value="">Select Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Form.Select>
          <Form.Control type="date" name="due_date_start" placeholder="Due Start" value={filters.due_date_start} onChange={handleFilterChange} />
          <Form.Control type="date" name="due_date_end" placeholder="Due End" value={filters.due_date_end} onChange={handleFilterChange} />
          {userRole === 'Admin' && (
            <Form.Select name="assigned_to" value={filters.assigned_to} onChange={handleFilterChange}>
              <option value="">Select Assigned To</option>
              {usersLoading ? <option>Loading...</option> : users.length === 0 ? <option>No users available</option> : users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </Form.Select>
          )}
          <Button type="submit">Apply Filters</Button>
        </Form.Group>
      </Form>

      {loading ? <Spinner animation="border" /> : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Assigned To</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.status}</td>
                <td>{task.priority}</td>
                <td>{task.due_date}</td>
                <td>{task.assigned_to?.name || 'Unassigned'}</td>
                <td>{task.created_by?.name}</td>
                <td>
                  {(hasManageTasks || (hasUpdateStatus && task.assigned_to_id === parseInt(userId))) && (
                    <Button variant="info" size="sm" onClick={() => openUpdateModal(task)} className="me-2">Update</Button>
                  )}
                  {hasManageTasks && <Button variant="danger" size="sm" onClick={() => handleDelete(task.id)}>Delete</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton><Modal.Title>Create Task</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control name="title" value={formData.title} onChange={handleFormChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control name="description" value={formData.description} onChange={handleFormChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select name="status" value={formData.status} onChange={handleFormChange}><option>PENDING</option><option>IN_PROGRESS</option><option>COMPLETED</option></Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Priority</Form.Label><Form.Select name="priority" value={formData.priority} onChange={handleFormChange}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Due Date</Form.Label><Form.Control type="datetime-local" name="due_date" value={formData.due_date} onChange={handleFormChange} /></Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assigned To</Form.Label>
              <Form.Select name="assigned_to_id" value={formData.assigned_to_id} onChange={handleFormChange}>
                <option value="">Select User</option>
                {usersLoading ? <option>Loading...</option> : users.length === 0 ? <option>No users available</option> : users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="primary" onClick={handleCreate} disabled={loading}>{loading ? <Spinner size="sm" /> : 'Create'}</Button></Modal.Footer>
      </Modal>

      {/* Update Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
        <Modal.Header closeButton><Modal.Title>Update Task</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            {hasManageTasks && (
              <>
                <Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control name="title" value={formData.title} onChange={handleFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control name="description" value={formData.description} onChange={handleFormChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Priority</Form.Label><Form.Select name="priority" value={formData.priority} onChange={handleFormChange}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></Form.Select></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Due Date</Form.Label><Form.Control type="datetime-local" name="due_date" value={formData.due_date} onChange={handleFormChange} /></Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned To</Form.Label>
                  <Form.Select name="assigned_to_id" value={formData.assigned_to_id} onChange={handleFormChange}>
                    <option value="">Select User</option>
                    {usersLoading ? <option>Loading...</option> : users.length === 0 ? <option>No users available</option> : users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select name="status" value={formData.status} onChange={handleFormChange}><option>PENDING</option><option>IN_PROGRESS</option><option>COMPLETED</option></Form.Select></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="primary" onClick={handleUpdate} disabled={loading}>{loading ? <Spinner size="sm" /> : 'Update'}</Button></Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;

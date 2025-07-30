import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signup } from '../api';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signup({ email, first_name: firstName, last_name: lastName, password, role });
      if (res.data.success) {
        toast.success('Signup successful! OTP sent to your email.');
        navigate('/verify-otp', { state: { email } }); // Pass email to OTP page
      } else {
        toast.error(res.data.message || 'Signup failed');
      }
    } catch (err) {
      toast.error('User already exists or invalid data');
    }
    setLoading(false);
  };

  return (
    <Container className="form-container">
      <h3 className="text-center mb-4">Signup for Task Manager</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>First Name</Form.Label>
          <Form.Control type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Last Name</Form.Label>
          <Form.Control type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Role</Form.Label>
          <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </Form.Select>
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <div className="loader"></div> : 'Signup'}
        </Button>
      </Form>
      <p className="text-center mt-3">
        Already have an account? <Link to="/">Login</Link>
      </p>
    </Container>
  );
};

export default Signup;

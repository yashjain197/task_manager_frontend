import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login, getPermissions } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await login({ email, password });
    if (res.data.success) {
      const { tokens, user, user_role, is_verified } = res.data.data;
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('userId', user.id);  // Now using the integer id
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userRole', user_role);
      localStorage.setItem('isVerified', is_verified);

      // Fetch and store permissions
      const permRes = await getPermissions(user.id);  // Now passing integer id
      localStorage.setItem('permissions', JSON.stringify(permRes.data.data));

      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(res.data.message || 'Login failed');
    }
  } catch (err) {
    toast.error('Invalid credentials');
  }
  setLoading(false);
};

  return (
    <Container className="form-container">
      <h3 className="text-center mb-4">Login to Task Manager</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <div className="loader"></div> : 'Login'}
        </Button>
      </Form>
      <p className="text-center mt-3">
        <Link to="/signup">Signup</Link> | <Link to="/forgot-password">Forgot Password?</Link>
      </p>
    </Container>
  );
};

export default Login;

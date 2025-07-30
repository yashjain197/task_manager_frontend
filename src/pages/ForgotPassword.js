import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await resetPassword({ email });
      if (res.data.success) {
        toast.success('Reset link sent to your email!');
      } else {
        toast.error(res.data.message || 'Failed');
      }
    } catch (err) {
      toast.error('User not found');
    }
    setLoading(false);
  };

  return (
    <Container className="form-container">
      <h3 className="text-center mb-4">Forgot Password</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <div className="loader"></div> : 'Send Reset Link'}
        </Button>
      </Form>
      <p className="text-center mt-3">
        <Link to="/">Back to Login</Link>
      </p>
    </Container>
  );
};

export default ForgotPassword;

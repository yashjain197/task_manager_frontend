import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOtp, sendOtp, getPermissions } from '../api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || ''; // From signup

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOtp({ email, otp });
      if (res.data.success) {
        const { tokens, user, user_role } = res.data.data;
        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
        localStorage.setItem('userId', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userRole', user_role);
        localStorage.setItem('isVerified', true);

        // Fetch and store permissions
        const permRes = await getPermissions(user.email);
        localStorage.setItem('permissions', JSON.stringify(permRes.data.data));

        toast.success('OTP verified! Logged in.');
        navigate('/dashboard');
      } else {
        toast.error(res.data.message || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification failed');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      await sendOtp({ email });
      toast.success('OTP resent!');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <Container className="form-container">
      <h3 className="text-center mb-4">Verify OTP</h3>
      <p>Enter the OTP sent to {email}</p>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>OTP</Form.Label>
          <Form.Control type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <div className="loader"></div> : 'Verify'}
        </Button>
      </Form>
      <p className="text-center mt-3">
        <Button variant="link" onClick={handleResend}>Resend OTP</Button>
      </p>
    </Container>
  );
};

export default VerifyOTP;

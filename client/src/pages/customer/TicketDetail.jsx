import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SupportAgent as SupportIcon,
  Store as VendorIcon,
  SmartToy as SystemIcon,
  AccessTime as TimeIcon,
  CheckCircle as ResolvedIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const STATUS_COLORS = {
  open: 'info',
  assigned: 'secondary',
  in_progress: 'warning',
  waiting_customer: 'warning',
  waiting_vendor: 'default',
  escalated: 'error',
  resolved: 'success',
  closed: 'default',
};

const CATEGORY_LABELS = {
  order_issue: 'Order Issue',
  product_inquiry: 'Product Inquiry',
  payment: 'Payment',
  shipping: 'Shipping',
  refund: 'Refund',
  general: 'General',
  technical: 'Technical Support',
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Rating dialog
  const [ratingDialog, setRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.data.ticket);
      setMessages(response.data.data.messages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      setSending(true);
      await api.post(`/tickets/${id}/messages`, {
        message: replyMessage,
      });
      setReplyMessage('');
      setSuccess('Reply sent successfully');
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitRating = async () => {
    try {
      await api.post(`/tickets/${id}/rate`, { rating, feedback });
      setSuccess('Thank you for your feedback!');
      setRatingDialog(false);
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const getSenderIcon = (type) => {
    switch (type) {
      case 'customer':
        return <PersonIcon />;
      case 'admin':
        return <SupportIcon />;
      case 'vendor':
        return <VendorIcon />;
      case 'system':
        return <SystemIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getSenderColor = (type) => {
    switch (type) {
      case 'customer':
        return '#1976d2';
      case 'admin':
        return '#388e3c';
      case 'vendor':
        return '#7b1fa2';
      case 'system':
        return '#757575';
      default:
        return '#1976d2';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      waiting_customer: 'Awaiting Your Reply',
      waiting_vendor: 'Awaiting Vendor',
      escalated: 'Escalated',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Ticket not found</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/tickets')}
          sx={{ mt: 2 }}
        >
          Back to Tickets
        </Button>
      </Box>
    );
  }

  const isResolved = ['resolved', 'closed'].includes(ticket.status);
  const canRate = isResolved && !ticket.satisfactionRating;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/tickets')}
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {ticket.ticketNumber}
        </Typography>
        <Chip
          label={getStatusLabel(ticket.status)}
          color={STATUS_COLORS[ticket.status]}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Ticket Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ticket Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Subject
              </Typography>
              <Typography variant="body1">{ticket.subject}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Category
              </Typography>
              <Typography variant="body1">
                {CATEGORY_LABELS[ticket.category] || ticket.category}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Priority
              </Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                {ticket.priority}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Created
              </Typography>
              <Typography variant="body1">
                {formatTime(ticket.createdAt)}
              </Typography>
            </Box>

            {ticket.order && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Related Order
                </Typography>
                <Typography variant="body1">
                  <Link to={`/orders`}>{ticket.order.orderNumber}</Link>
                </Typography>
              </Box>
            )}

            {ticket.vendor && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Vendor
                </Typography>
                <Typography variant="body1">{ticket.vendor.storeName}</Typography>
              </Box>
            )}

            {ticket.resolvedAt && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Resolved At
                </Typography>
                <Typography variant="body1">
                  {formatTime(ticket.resolvedAt)}
                </Typography>
              </Box>
            )}

            {ticket.satisfactionRating && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Your Rating
                </Typography>
                <Rating value={ticket.satisfactionRating} readOnly size="small" />
              </Box>
            )}

            {canRate && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<ResolvedIcon />}
                onClick={() => setRatingDialog(true)}
                sx={{ mt: 2 }}
              >
                Rate Support
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Messages */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Conversation
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Messages List */}
            <Box
              sx={{
                maxHeight: 500,
                overflowY: 'auto',
                mb: 2,
                pr: 1,
              }}
            >
              {messages.map((msg, index) => (
                <Box
                  key={msg._id || index}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 2,
                    flexDirection: msg.sender.type === 'customer' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: getSenderColor(msg.sender.type),
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getSenderIcon(msg.sender.type)}
                  </Avatar>
                  <Box
                    sx={{
                      maxWidth: '75%',
                      bgcolor: msg.sender.type === 'customer' ? 'primary.light' : 'grey.100',
                      color: msg.sender.type === 'customer' ? 'white' : 'text.primary',
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2">
                        {msg.sender.name || (msg.sender.type === 'customer' ? 'You' : 'Support')}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: msg.sender.type === 'customer' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <TimeIcon sx={{ fontSize: 12 }} />
                        {formatTime(msg.createdAt)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {msg.message}
                    </Typography>
                    {msg.isAutoResponse && (
                      <Chip
                        size="small"
                        label="Auto-response"
                        sx={{ mt: 1, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Reply Form */}
            {!['closed'].includes(ticket.status) && (
              <Box>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={sending}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    endIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sending}
                  >
                    Send Reply
                  </Button>
                </Box>
              </Box>
            )}

            {ticket.status === 'closed' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This ticket has been closed. If you need further assistance, please create a new ticket.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog} onClose={() => setRatingDialog(false)}>
        <DialogTitle>Rate Your Support Experience</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography gutterBottom>
              How satisfied are you with the support you received?
            </Typography>
            <Rating
              value={rating}
              onChange={(e, newValue) => setRating(newValue)}
              size="large"
              sx={{ my: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Feedback (Optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRating}>
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

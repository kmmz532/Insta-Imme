import { Box } from '@mui/material';
import { PostHistoryList } from '../../components/post/PostHistoryList';

export function HistoryPage() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <PostHistoryList />
      </Box>
    </Box>
  );
}

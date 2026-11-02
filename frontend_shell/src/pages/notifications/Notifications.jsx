import React from "react";
import { Box, Typography, Paper, List, ListItem, ListItemText } from "@mui/material";

const mockNotifications = [
  {
    id: 1,
    title: "Welcome",
    description: "You have successfully logged into the admin dashboard.",
    time: "Just now",
  },
];

export default function Notifications() {
  const hasNotifications = mockNotifications.length > 0;

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        Notifications
      </Typography>
      {hasNotifications ? (
        <Paper>
          <List>
            {mockNotifications.map((n) => (
              <ListItem key={n.id} divider>
                <ListItemText primary={n.title} secondary={`${n.description} • ${n.time}`} />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography color="text.secondary">You have no notifications.</Typography>
      )}
    </Box>
  );
}


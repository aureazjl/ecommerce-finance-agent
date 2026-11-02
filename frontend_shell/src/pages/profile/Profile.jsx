import React from "react";
import { Avatar, Box, Divider, Stack, Typography, Paper, Button } from "@mui/material";

export default function Profile() {
  const user = {
    name: "Hassen Khrouf",
    role: "Administrator",
    email: "hassen.khrouf@gmail.com",
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar sx={{ width: 72, height: 72 }}>
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </Avatar>
          <Box>
            <Typography variant="h6">{user.name}</Typography>
            <Typography color="text.secondary">{user.role}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" gutterBottom>
          Account
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="primary">
            Edit profile
          </Button>
          <Button variant="outlined" color="error">
            Log out
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}


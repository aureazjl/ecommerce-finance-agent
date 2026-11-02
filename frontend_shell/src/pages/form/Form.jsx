import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button, Stack } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useForm } from "react-hook-form";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { VerticalAlignTop } from "@mui/icons-material";
import Header from "../../components/Header";

const access = [
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "User", label: "User" },
];
const regEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regContact = /^\(?([0-9]{2})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{3})$/;

export default function Form() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // <-- Add reset
  } = useForm();

  const [open, setOpen] = React.useState(false);
  const [alertMsg, setAlertMsg] = React.useState(""); // <-- Add alert message state

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const onSubmit = (data) => {
    setAlertMsg(
      `User "${data.firstName} ${data.lastName}" created successfully!`
    );
    handleClick();
    reset(); // <-- Reset the form after submit
  };

  return (
    <Box>
      <Header title="CREATE USER" subTitle="Create a New User Profile" />
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: "column",
        }}
        noValidate
        autoComplete="off"
      >
        <Stack direction="row" spacing={2}>
          <TextField
            sx={{ flex: 1 }}
            id="filled-basic"
            label="First Name *"
            variant="filled"
            error={!!errors.firstName}
            helperText={
              errors.firstName ? "Field is Required & min 3 characters" : null
            }
            {...register("firstName", { required: true, minLength: 3 })}
          />
          <TextField
            sx={{ flex: 1 }}
            id="filled-basic"
            label="Last Name *"
            variant="filled"
            error={!!errors.lastName}
            helperText={
              errors.lastName ? "Field Required & min 3 characters" : null
            }
            {...register("lastName", { required: true, minLength: 3 })}
          />
        </Stack>
        <TextField
          label="Email *"
          variant="filled"
          error={!!errors.email}
          helperText={
            errors.email ? "Field Required OR email is not valid" : null
          }
          {...register("email", { required: true, pattern: regEmail })}
        />
        <TextField
          label="Contact Number *"
          variant="filled"
          type="number" // <-- Make input type number
          error={!!errors.contact}
          helperText={
            errors.contact ? "Field Required OR contact is not valid" : null
          }
          {...register("contact", { required: true, pattern: regContact })}
        />
        <TextField
          label="Adress 1 *"
          variant="filled"
          error={!!errors.adress}
          helperText={errors.adress ? "Field Required" : null}
          {...register("adress", { required: true, minLength: 3 })}
        />
        <TextField label="Adress 2" variant="filled" />
        <TextField
          id="filled-select-role"
          select
          label="Role"
          defaultValue="User"
          variant="filled"
        >
          {access.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ textAlign: "right" }}>
          <Button
            type="submit"
            sx={{ textTransform: "capitalize" }}
            variant="contained"
          >
            Create New User
          </Button>
          {/* Snackbar and Alert components to show success message*/}
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
          >
            <Alert
              onClose={handleClose}
              severity="success"
              variant="filled"
              sx={{ width: "100%" }}
            >
              {alertMsg}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}

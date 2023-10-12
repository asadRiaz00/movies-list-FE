import { Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import MaterialReactTable from "material-react-table";
import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";
import { createMovie, deleteMovie, getMovies, updateMovie } from "../api/endPoints";

const Home = ({}) => {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState(() => []);
  const [validationErrors, setValidationErrors] = useState({});
  const withCredentials = false;   //for local testing

  // const scrapData = () => {
  //   Swal.fire({
  //     title: "Are you sure?",
  //     showCancelButton: true,
  //     confirmButtonText: "Scrap",
  //   }).then(async (result) => {
  //     /* Read more about isConfirmed, isDenied below */
  //     if (result.isConfirmed) {
  //       try {
  //         const response = await axios.post(postProcedure, {
  //           headers: { "Content-Type": "application/json" },
  //           withCredentials: true,
  //         });
  //         Swal.fire("Saved!", "", "success");
  //       } catch (error) {
  //         // console.log(error);
  //         Swal.fire("Failed to run", "", "error");
  //       }
  //     }
  //   });
  // };

  const { data, status } = useQuery("movieData", async () => {
    const response = await axios.get(getMovies, {
      headers: { "Content-Type": "application/json" },
      withCredentials: withCredentials,
    });
    console.log(response.data);

    setTableData([...response.data.data]);
    return "";
  });

  const handleCreateNewRow = async (values) => {
    try {
      const response = await axios.post(createMovie, values, {
        headers: { "Content-Type": "application/json" },
        withCredentials: withCredentials,
      });
      // console.log(response);
      toast.success("Successfully add new movie !", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } catch (error) {
      // console.log(error);
      toast.error("Failed to add new movie !", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    }
  };

  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    // if (!Object.keys(validationErrors).length) {

    try {
      const response = await axios.put(updateMovie.replace(":id", row.getValue("id")), values, {
        headers: { "Content-Type": "application/json" },
        withCredentials: withCredentials,
      });
      // console.log(response);
      let newData = tableData;
      newData[row.index] = values;
      setTableData([...newData]);
      toast.success("Successfully update  item !", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } catch (error) {
      console.log(error.response.data.message);
      toast.error("Failed to  update  item! "+error.response.data.message, {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    }
    // tableData[row.index] = values;
    // //send/receive api updates here, then refetch or update local table data for re-render
    // setTableData([...tableData]);
    exitEditingMode(); //required to exit editing mode and close modal
    // }
  };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    async (row) => {
      // console.log(row);
      if (
        !window.confirm(
          `Are you sure you want to delete ${row.getValue("name")}`
        )
      ) {
        return;
      }
      try {
        const response = await axios.delete(
          deleteMovie.replace(":id", row.getValue("id")),
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: withCredentials,
          }
        );
        // console.log(response);
        let newData = tableData.splice(row.index, 1);
        setTableData([...newData]);
        toast.success("Successfully deleted  item !", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      } catch (error) {
        // console.log(error);
        toast.error("Failed to  delete  item!", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      }

      //send api delete request here, then refetch or update local table data for re-render

      // tableData.splice(row.index, 1);
      // setTableData([...tableData]);
    },
    [tableData]
  );

  const getCommonEditTextFieldProps = useCallback(
    (cell) => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === "email"
              ? validateEmail(event.target.value)
              : cell.column.id === "age"
              ? validateAge(+event.target.value)
              : validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        enableColumnOrdering: false,
        enableEditing: false, //disable editing on this column
        enableSorting: false,
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Movies Name",
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "duration",
        header: "Duration",
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
    ],
    [getCommonEditTextFieldProps]
  );

  return (
    <>
      <Stack spacing={4} marginX={4} mt={4}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Grid></Grid>
          <Typography variant="h5" component="h2">
            MOVIES DATABASE
          </Typography>

          {/* <Button onClick={() => scrapData()} variant="outlined">
            DOWNLOAD LIST
          </Button> */}
        </Box>
        <MaterialReactTable
          displayColumnDefOptions={{
            "mrt-row-actions": {
              muiTableHeadCellProps: {
                align: "center",
              },
              size: 120,
            },
          }}
          columns={columns}
          data={tableData}
          editingMode="modal" //default
          enableColumnOrdering
          enableEditing
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={handleCancelRowEdits}
          renderRowActions={({ row, table }) => (
            <Box sx={{ display: "flex", gap: "1rem" }}>
              <Tooltip arrow placement="left" title="Edit">
                <IconButton onClick={() => table.setEditingRow(row)}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement="right" title="Delete">
                <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          renderTopToolbarCustomActions={() => (
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="contained"
            >
              Create New
            </Button>
          )}
        />
      </Stack>
      {/* <Button size="large" variant="contained" onClick={() => setAuth(false)}>
        Log out
      </Button> */}

      <CreateNewAccountModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
      <ToastContainer autoClose={2000} />
    </>
  );
};

//example of creating a mui dialog modal for creating new rows
export const CreateNewAccountModal = ({ open, columns, onClose, onSubmit }) => {
  const [values, setValues] = useState({
    name: "",
    duration: "",
    rating: "",
  });

  // console.log(values)
  const handleSubmit = async () => {
    //put your validation logic here
    // console.log(values);

    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Create New Movie</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: "100%",
              minWidth: { xs: "300px", sm: "360px", md: "400px" },
              gap: "1.5rem",
            }}
          >
            {columns.map((column) => {
              // Remove columns from new update
              if (
                column.accessorKey === "name" ||
                column.accessorKey === "duration" ||
                column.accessorKey === "rating"
              ) {
                return (
                  <TextField
                    key={column.accessorKey}
                    label={column.header}
                    name={column.accessorKey}
                    onChange={(e) =>
                      setValues({ ...values, [e.target.name]: e.target.value })
                    }
                  />
                );
              }
            })}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: "1.25rem" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Create New Movie
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value) => !!value.length;
const validateEmail = (email) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
const validateAge = (age) => age >= 18 && age <= 50;

export default Home;

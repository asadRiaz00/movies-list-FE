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
import { CSVLink } from "react-csv";
import { useQuery } from "react-query";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";
import {
  createMovie,
  deleteMovie,
  getMovies,
  updateMovie,
} from "../api/endPoints";

const Home = ({}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState(() => []);
  const [validationErrors, setValidationErrors] = useState({});
  const withCredentials = false; //for local testing

  const { data, status } = useQuery("movieData", async () => {
    const response = await axios.get(getMovies, {
      headers: { "Content-Type": "application/json" },
      withCredentials: withCredentials,
    });
    console.log(response.data);

    setTableData([...response.data.data]);
    return "";
  });

 const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(tableData)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "movies-list.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }
  


  const handleCreateNewRow = async (values) => {
    try {
      let format = values.duration.slice(-1);
      if (format === "m") {
        values.duration = (parseFloat(values.duration.slice(0, -1)) / 60)
          .toFixed(2)
          .replace(/[.,]00$/, "");
      } else {
        values.duration = parseFloat(values.duration.slice(0, -1))
          .toFixed(2)
          .replace(/[.,]00$/, "");
      }
      values.rating = parseFloat(values.rating).toFixed(2);
     await axios.post(createMovie, values, {
        headers: { "Content-Type": "application/json" },
        withCredentials: withCredentials,
      });
      const response = await axios.get(getMovies, {
        headers: { "Content-Type": "application/json" },
        withCredentials: withCredentials,
      });  
      setTableData([...response.data.data]);
      // console.log(response);
      toast.success("Successfully add new movie !", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to add new movie ! " + error.response.data.message, {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    }
  };

  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    // if (!Object.keys(validationErrors).length) {
    let format = values.duration.slice(-1);
    if (format === "m") {
      values.duration = parseFloat(values.duration.slice(0, -1) / 60)
        .toFixed(2)
        .replace(/[.,]00$/, "");
    } else {
      values.duration = parseFloat(values.duration.slice(0, -1))
        .toFixed(2)
        .replace(/[.,]00$/, "");
    }
    values.rating = parseFloat(values.rating)
      .toFixed(2)
      .replace(/[.,]00$/, "");

    try {
      await axios.put(updateMovie.replace(":id", row.getValue("id")), values, {
        headers: { "Content-Type": "application/json" },
        withCredentials: withCredentials,
      });
      let newData = tableData;
      newData[row.index] = values;
      setTableData([...newData]);
      toast.success("Successfully update  movie!", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } catch (error) {
      console.log(error.response.data.message);
      toast.error("Failed to  update  movie! " + error.response.data.message, {
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
        await axios.delete(deleteMovie.replace(":id", row.getValue("id")), {
          headers: { "Content-Type": "application/json" },
          withCredentials: withCredentials,
        });
        // console.log(response);
        let newData = tableData.splice(row.index, 1);
        setTableData([...newData]);
        toast.success("Successfully deleted  movie !", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      } catch (error) {
        // console.log(error);
        toast.error(
          "Failed to  delete  movie! " + error.response.data.message,
          {
            position: toast.POSITION.BOTTOM_CENTER,
          }
        );
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
            cell.column.id === "name"
              ? validateName(event.target.value)
              : cell.column.id === "duration"
              ? validateDuration(event.target.value)
              : cell.column.id === "rating"
              ? validateRating(+event.target.value)
              : validateRequired(event.target.value);
          const validationMessage =
            cell.column.id === "name"
              ? "Name is required, 2-100 characters"
              : cell.column.id === "duration"
              ? "Duration in  1-720 minutes or 0.1-12 hours, format: Xh or Xm"
              : cell.column.id === "rating"
              ? "Rating out of 10, Required, between 0 and 10, decimal values allowed"
              : "This field is required";
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationMessage,
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
        validate: (rowData) => Boolean(rowData.name),
      },
      {
        accessorKey: "duration",
        header: "Duration",
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        Cell: (props) => <div> {props.renderedCellValue} h </div>,
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
        
          <Stack 
          flexDirection={'row'}
         
          >
          <Button 
          variant="outlined"
          style={{marginRight: '10px'}}
          >
           {/* Donwload CSV file */}
          <CSVLink data={tableData} 
          filename={"movies-list.csv"}
          className="btn btn-primary"
          target="_blank"
          >
            Download CSV
          </CSVLink>
          </Button>
         
           {/* Donwload TXT file */}
           <Button   variant="outlined" onClick={downloadText}>Download Text</Button>
           </Stack>
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
    // validation
    // console.log(values);
    if (!values.name) {
      toast.error("Name is required !", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      return;
    }
    if (
      !values.duration ||
      !validateDuration(values.duration) ||
      !values.name ||
      !validateName(values.name) ||
      !values.rating ||
      !validateRating(values.rating)
    ) {
      toast.error("Remove the Errors", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      return;
    }
    //put your validation logic here
    // console.log(values);

    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open} size="large">
      <DialogTitle textAlign="center">Create New Movie</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: "100%",
              minWidth: { xs: "300px", sm: "360px", md: "400px" },
              gap: "1.5rem",
            }}
            marginTop={2}
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
                    {...column.muiTableBodyCellEditTextFieldProps({
                      cell: {
                        id: column.accessorKey,
                        column,
                      },
                    })}
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
const validateDuration = (duration) => {
  //get last char
  const lastChar = duration.slice(-1);
  if (lastChar === "h" || lastChar === "m") {
    //get number value
    const number = duration.slice(0, -1);
    if (lastChar === "h") {
      return number >= 0.1 && number <= 12;
    } else {
      return number >= 1 && number <= 720;
    }
  } else return false;
};

const validateRating = (age) => age > 0 && age <= 10;
const validateName = (name) => name.length >= 2 && name.length <= 100;

export default Home;

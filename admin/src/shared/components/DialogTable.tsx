import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Paper, Table } from "@mui/material";

type DialogTableProps = {
  children: ReactNode;
  size?: "small" | "medium";
  tableSx?: SxProps<Theme>;
  paperSx?: SxProps<Theme>;
};

const basePaperSx: SxProps<Theme> = {
  borderRadius: 1,
  overflow: "hidden",
};

const baseTableSx: SxProps<Theme> = (theme) => ({
  "& thead th": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(15, 23, 42, 0.6)"
        : "grey.50",
    color: "text.secondary",
    fontWeight: 600,
    fontSize: "0.75rem",
    borderBottomColor: "divider",
  },
  "& thead th:not(.MuiTableCell-paddingCheckbox), & tbody td:not(.MuiTableCell-paddingCheckbox), & tbody th:not(.MuiTableCell-paddingCheckbox)": {
    py: 1,
    px: 1.25,
  },
  "& thead th.MuiTableCell-paddingCheckbox, & tbody td.MuiTableCell-paddingCheckbox": {
    py: 0.5,
    px: 0.5,
  },
  "& tbody td, & tbody th": {
    borderBottomColor: "divider",
  },
  "& tbody tr": {
    height: 52,
  },
  "& tbody tr:last-of-type td, & tbody tr:last-of-type th": {
    borderBottom: 0,
  },
});

const DialogTable = ({
  children,
  size = "small",
  tableSx,
  paperSx,
}: DialogTableProps) => (
  <Paper variant="outlined" sx={[basePaperSx, paperSx]}>
    <Table size={size} sx={[baseTableSx, tableSx]}>
      {children}
    </Table>
  </Paper>
);

export default DialogTable;

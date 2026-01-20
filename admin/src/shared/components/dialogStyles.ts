import type { SxProps, Theme } from "@mui/material/styles";

export const dialogTitleSx: SxProps<Theme> = (theme) => ({
  backgroundColor:
    theme.palette.mode === "light"
      ? "rgba(248, 250, 252, 0.95)"
      : "rgba(15, 23, 42, 0.95)",
  borderBottom: "1px solid",
  borderColor:
    theme.palette.mode === "light"
      ? "rgba(15, 23, 42, 0.08)"
      : "rgba(148, 163, 184, 0.25)",
});

export const dialogContentSx: SxProps<Theme> = {
  backgroundColor: "background.paper",
};

export const dialogPaperSx: SxProps<Theme> = (theme) => ({
  borderRadius: 2,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  backgroundImage: "none",
});

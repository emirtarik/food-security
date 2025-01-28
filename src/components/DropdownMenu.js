import React from "react";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Stack from "@mui/material/Stack";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export default function MenuListComposition({ firstLevel, secondLevel, icon }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleOpen = () => {
    if (window.innerWidth > 992) {
      setOpen(true);
    }
  };

  const handleCloseHover = () => {
    if (window.innerWidth > 992) {
      setOpen(false);
    }
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const theme = createTheme({
    palette: {
      primary: {
        main: "#FFFFFF",
      },
      typography: {
        fontFamily: ["Lato"],
      },
    },
    zIndex: {
      dropdown: 9999,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Stack direction="row" spacing={2}>
        <div onMouseEnter={handleOpen} onMouseLeave={handleCloseHover}>
          <Button
            ref={anchorRef}
            id="composition-button"
            aria-controls={open ? "composition-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            onClick={handleToggle}
            sx={{ fontFamily: "Lato" }}
            disableRipple
          >
            {icon && <img src={icon} alt="" style={{ marginRight: 8, maxWidth: 20, maxHeight: 20, verticalAlign: 'middle' }} />}
            {firstLevel}
          </Button>
          <Popper
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            placement="bottom-start"
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === "bottom-start" ? "left top" : "left bottom",
                }}
              >
                <Paper style={{ zIndex: theme.zIndex.dropdown }}>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList
                      autoFocusItem={open}
                      id="composition-menu"
                      aria-labelledby="composition-button"
                      onKeyDown={handleListKeyDown}
                    >
                      {secondLevel.map((item, index) => (
                        <MenuItem
                          key={index}
                          onClick={handleClose}
                          component="a"
                          href={item.href}
                          sx={{ fontFamily: "Lato" }}
                        >
                          {item.text}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </div>
      </Stack>
    </ThemeProvider>
  );
}

import NextLink from "next/link";
import {
  Modal,
  Typography,
  Link,
  List,
  ListItem,
  Button,
  Box,
  FormControlLabel,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useDisclaimer } from "../../hooks/useDisclaimer";

import { trackConnectWallet } from "../../utils/telemetry";
import { CloseButton } from "../Modal/components";
import { CheckBoxCustom } from "./svg";

export default function Disclaimer({ isOpen = false, onClose }) {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const { setDisclaimer } = useDisclaimer();
  const theme = useTheme();

  const handleAgree = () => {
    trackConnectWallet();
    onClose();
    setDisclaimer(true);
    window.modal.show();
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        bgcolor={theme.palette.background.paper}
        borderRadius="0.5rem"
        className="p-6"
        width={{ small: "100%", md: "460px" }}
        position="relative"
        color="#C0C4E9"
        sx={{
          display: "flex",
          flexDirection: "column",
          mx: "auto",
          maxHeight: "680px",
          height: "70vh",
          overflow: "hidden",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            display: "none",
          },
          border: "1px solid #303037",
          [theme.breakpoints.down("sm")]: {
            position: "absolute",
            bottom: "0px",
            margin: "0px",
          },
          [theme.breakpoints.up("sm")]: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          },
          scrollbarWidth: "none",
        }}
      >
        <CloseButton onClose={onClose} />
        <Typography
          variant="h5"
          component="h5"
          style={{ color: "#fff", fontSize: "18px", fontWeight: "500" }}
        >
          Disclaimer
        </Typography>
        <Box sx={{ overflow: "scroll", marginTop: "30px" }}>
          <FormControlLabel
            control={
              <CheckBoxCustom
                checked={checked1}
                onClick={() => setChecked1(!checked1)}
                className="flex flex-shrink-0 mr-3 relative top-0.5"
              />
            }
            sx={{ display: "flex", alignItems: "flex-start", marginLeft: "0px" }}
            label={
              <Typography
                fontSize="0.75rem"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I have read and understood the{" "}
                <NextLink href="/declaration" passHref>
                  <Link href="/declaration" target="_blank">
                    Declaration and Disclaimers
                  </Link>
                </NextLink>
                , that such understanding is irrevocable and will apply to all of my uses of the
                Site without me providing confirmation in each specific instance.
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <CheckBoxCustom
                checked={checked2}
                onClick={() => setChecked2(!checked2)}
                className="flex flex-shrink-0 mr-3 relative top-0.5"
              />
            }
            sx={{ display: "flex", alignItems: "flex-start", marginLeft: "0px", marginTop: "30px" }}
            label={
              <Typography
                fontSize="0.75rem"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I acknowledge and agree that the Site solely provides information about data on the{" "}
                <Link href="https://near.org" target="_blank">
                  NEAR blockchain
                </Link>
                . I accept that the Site has no operators and that no operator has custody over my
                funds, ability or duty to transact on my behalf or power to reverse my transactions.
                The Site affirmers do not endorse or provide any warranty with respect to any
                tokens.
              </Typography>
            }
          />

          <Typography
            fontSize="0.875rem"
            fontWeight="300"
            mt="1rem"
            sx={{ fontFamily: "jost", color: "#fff" }}
          >
            In addition you acknowledge that:
          </Typography>
          <List
            dense
            sx={{
              listStyleType: "disc",
              pl: 2,
              pt: "0px",
              "& .MuiListItem-root": {
                display: "list-item",
                p: 0,
              },
            }}
          >
            <ListItem sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
              <Typography
                fontSize="12px"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I am not a person or company who is a resident of, is located, incorporated, or has
                a registered agent in, the United States of America or a Restricted Territory as
                defined in the Declaration and Disclaimers;
              </Typography>
            </ListItem>
            <ListItem sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
              <Typography
                fontSize="12px"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I will not in the future access this site while located in the United States of
                America or a Restricted Territory;
              </Typography>
            </ListItem>
            <ListItem sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
              <Typography
                fontSize="12px"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I am not using, and will not in the future use, a virtual private network or other
                means to mask my physical location from a Restricted Territory;
              </Typography>
            </ListItem>
            <ListItem sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
              <Typography
                fontSize="12px"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I am lawfully permitted to access this site under the laws of the jurisdiction in
                which I reside and am located;
              </Typography>
            </ListItem>
            <ListItem sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
              <Typography
                fontSize="12px"
                sx={{ fontFamily: "jost", color: "rgba(255, 255, 255, 0.5)" }}
              >
                I understand the risks associated with blockchain technology and trading in digital
                assets.
              </Typography>
            </ListItem>
          </List>
        </Box>
        <Box display="flex" justifyContent="center" flexDirection="column">
          <Button
            variant="contained"
            sx={{
              mx: "0",
              my: "1rem",
              color: "#000",
              fontSize: "16px",
              textTransform: "none",
              ":hover": { backgroundColor: "#00F7A5" },
              ":disabled": {
                color: "rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            }}
            disabled={!checked1 || !checked2}
            onClick={handleAgree}
          >
            Agree & Confirm
          </Button>
          <Typography
            fontSize="12px"
            textAlign="center"
            mx="4rem"
            sx={{
              [theme.breakpoints.down("sm")]: {
                margin: "10px",
              },
              fontFamily: "jost",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            By clicking this button you acknowledge and agree to all statements in this disclaimer.
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
}

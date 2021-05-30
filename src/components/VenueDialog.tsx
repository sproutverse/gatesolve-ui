import React from "react";
import {
  Button,
  IconButton,
  DialogTitle,
  DialogContent,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
  Drawer,
} from "@material-ui/core";

import {
  Close as CloseIcon,
  ExpandLess as ExpandIcon, // https://material.io/components/sheets-bottom
  ExpandMore as CollapseIcon,
} from "@material-ui/icons";

import type { ElementWithCoordinates } from "../overpass";

import { NetworkState, OlmapResponse } from "../olmap";

import OLMapImages from "./OLMapImages";

interface VenueDialogProps {
  open: boolean;
  collapsed: boolean;
  venueOlmapData?: NetworkState<OlmapResponse>;
  onClose: () => void;
  onEntranceSelected: (entranceId: number) => void;
  onUnloadingPlaceSelected: (
    unloadingPlace: ElementWithCoordinates,
    entranceIds: Array<number>
  ) => void;
  onCollapsingToggled: () => void;
}

const deliveryTypePriorities = {
  main: 2,
  yes: 1,
  null: 0,
  "": 0,
  no: -1,
};

const VenueDialog: React.FC<VenueDialogProps> = ({
  open,
  collapsed,
  venueOlmapData,
  onClose,
  onEntranceSelected,
  onUnloadingPlaceSelected,
  onCollapsingToggled,
}) => {
  if (
    venueOlmapData?.state !== "success" ||
    !venueOlmapData.response.workplace
  ) {
    return null;
  }
  const imageNotes = venueOlmapData.response.image_notes;
  const { workplace } = venueOlmapData.response;
  const workplaceEntrances = workplace.workplace_entrances;
  workplaceEntrances.sort(
    (a, b) =>
      deliveryTypePriorities[b.deliveries || "null"] -
      deliveryTypePriorities[a.deliveries || "null"]
  );

  const workplaceAdditionalImageNotes = imageNotes.filter(
    (note) => note.image && note.tags.find((x) => x === "Workplace")
  );
  const workplaceProfileImages = workplace.image_note.image
    ? [workplace.image_note]
    : workplaceAdditionalImageNotes;

  const unloadingPlaceEntrances = {} as Record<number, Array<number>>;
  const unloadingPlaces = workplaceEntrances.flatMap((workplaceEntrance) =>
    workplaceEntrance.unloading_places.flatMap((unloadingPlace) => {
      const foundEntrances = unloadingPlaceEntrances[unloadingPlace.id];
      const newEntrance = workplaceEntrance.entrance_data.osm_feature;
      if (foundEntrances) {
        foundEntrances.push(newEntrance);
        return [];
      }
      unloadingPlaceEntrances[unloadingPlace.id] = [newEntrance];
      return [unloadingPlace];
    })
  );

  return (
    <Drawer
      open={open}
      anchor="bottom"
      variant="persistent"
      PaperProps={{ style: { maxHeight: "45%" } }} // 50% of the height under the app bar
    >
      <DialogTitle>
        <IconButton
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
          }}
          onClick={() => onCollapsingToggled()}
        >
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </IconButton>
        {workplace.as_osm_tags.name}
        <IconButton
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        style={{
          display: collapsed ? "none" : "block",
          overflow: "auto",
        }}
      >
        <OLMapImages
          onImageClick={() => {}}
          olmapData={{
            state: "success",
            response: {
              ...venueOlmapData.response,
              image_notes: workplaceProfileImages,
            },
          }}
        />
        <Typography variant="body2" color="textSecondary" component="p">
          {workplace.delivery_instructions}
        </Typography>
        {workplaceEntrances.map((workplaceEntrance) => (
          <Card
            key={workplaceEntrance.id}
            style={{ marginTop: "1em" }}
            variant="outlined"
          >
            <CardMedia
              component="img"
              image={workplaceEntrance.image_note.image}
              style={{
                width: "50%",
                height: "auto",
                float: "right",
              }}
            />
            <CardHeader
              title={`${[
                workplaceEntrance.description,
                workplaceEntrance.delivery_types.join("; "),
              ]
                .filter((x) => x)
                .join(": ")}`}
              subheader={
                workplaceEntrance.delivery_hours || workplace.delivery_hours
              }
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" component="p">
                {workplaceEntrance.delivery_instructions}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                size="small"
                style={{ backgroundColor: "#64be14", color: "#fff" }}
                type="button"
                aria-label="Set destination"
                onClick={(): void =>
                  onEntranceSelected(
                    workplaceEntrance.entrance_data.osm_feature
                  )
                }
              >
                Destination
              </Button>
            </CardActions>
          </Card>
        ))}
        {unloadingPlaces.map((unloadingPlace) => (
          <Card
            key={unloadingPlace.id}
            style={{ marginTop: "1em" }}
            variant="outlined"
          >
            <CardMedia
              component="img"
              image={unloadingPlace.image_note.image}
              style={{
                width: "50%",
                height: "auto",
                float: "right",
              }}
            />
            <CardHeader
              title={unloadingPlace.as_osm_tags["parking:condition"]}
              subheader={unloadingPlace.opening_hours}
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" component="p">
                {unloadingPlace.description}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                size="small"
                style={{ backgroundColor: "#00afff", color: "#fff" }}
                type="button"
                aria-label="Set origin"
                onClick={(): void =>
                  onUnloadingPlaceSelected(
                    {
                      id: unloadingPlace.osm_feature,
                      type: "node",
                      lat: Number(unloadingPlace.image_note.lat),
                      lon: Number(unloadingPlace.image_note.lon),
                    },
                    unloadingPlaceEntrances[unloadingPlace.id]
                  )
                }
              >
                Origin
              </Button>
            </CardActions>
          </Card>
        ))}
      </DialogContent>
    </Drawer>
  );
};
export default VenueDialog;
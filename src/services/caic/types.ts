export interface CaicResponseMeta {
  current_page: number;
  page_items: number;
  total_pages: number;
  total_count: number;
}

export interface CaicResponseLinks {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

export interface BackcountryZone {
  id: string;
  type: string;
  parent_id?: string;
  slug?: string;
  title?: string;
  category?: string;
  category_order?: number;
  is_root?: boolean;
  is_leaf?: boolean;
  tree_level?: number;
  parent_url?: string;
  created_at?: string;
  updated_at?: string;
  url?: string;
  geojson_url?: string;
}

export interface HighwayZone {
  id?: string;
  type?: string;
  parent_id?: string;
  slug?: string;
  title?: string;
  category?: string;
  category_order?: number;
  is_root?: boolean;
  is_leaf?: boolean;
  tree_level?: number;
  parent_url?: string;
  children_urls?: string[];
  created_at?: string;
  updated_at?: string;
  url?: string;
  geojson_url?: string;
}

export interface ObsReport {
  id?: string;
  status?: string;
  is_locked?: boolean;
  is_anonymous?: boolean;
  url?: string;
}

export interface AvalancheDetail {
  id: string;
  type: string;
  description?: string;
  classic_id?: number;
}

export interface SnowpackDetail {
  id: string;
  type: string;
  description?: string;
  classic_id?: number;
}

export interface WeatherDetail {
  id: string;
  type: string;
  description?: string;
  classic_id?: number;
}

export interface AvalancheObservation {
  id: string;
  type?: string;
  backcountry_zone_id?: string;
  backcountry_zone?: BackcountryZone;
  highway_zone_id?: string;
  observed_at?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  classic_id?: number;
  classic_observation_report_id?: number;
  classic_observation_report_url?: string;
  observation_report_status?: string;
  observation_report_url?: string;
  comments?: string;
  location?: string;
  lastname?: string;
  full_name?: string;
  date_known?: string;
  time_known?: string;
  op_name?: string;
  is_locked?: boolean;
  number?: number;
  hw_op_bc?: string;
  path?: string;
  landmark?: string;
  type_code?: string;
  problem_type?: string;
  aspect?: string;
  elevation?: string;
  relative_size?: string;
  destructive_size?: string;
  primary_trigger?: string;
  secondary_trigger?: string;
  is_incident?: boolean;
  area?: string;
  angle_average?: number;
  angle_maximum?: number;
  elevation_feet?: number;
  surface?: string;
  weak_layer?: string;
  grain_type?: string;
  crown_average?: number;
  crown_maximum?: number;
  crown_units?: string;
  width_average?: number;
  width_maximum?: number;
  width_units?: string;
  vertical_average?: number;
  vertical_maximum?: number;
  vertical_units?: string;
  terminus?: string;
  road_status?: string;
  road_depth?: number;
  road_units?: string;
  road_depth_units?: string;
  road_length?: number;
  road_length_units?: string;
  observation_report?: ObsReport;
  avalanche_detail?: AvalancheDetail;
}

export interface SnowpackObservation {
  id: string;
  type: string;
  backcountry_zone_id?: string;
  backcountry_zone?: BackcountryZone;
  highway_zone_id?: string;
  observed_at?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  comments?: string;
  url?: string;
  cracking?: string;
  collapsing?: string;
  weak_layers?: string;
  rose?: string;
}

export interface ObservationAsset {
  id: string;
  type: string;
  status?: string;
  caption?: string;
  tags?: string[];
  is_redacted?: boolean;
  is_locked?: boolean;
  is_avalanche?: boolean;
  location_context?: string;
  full_url?: string;
  reduced_url?: string;
  thumb_url?: string;
  external_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeatherObservation {
  id: string;
  type: string;
  backcountry_zone_id?: string;
  backcountry_zone?: BackcountryZone;
  highway_zone_id?: string;
  highway_zone?: HighwayZone;
  observed_at?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  classic_id?: number;
  classic_observation_report_id?: number;
  classic_observation_report_url?: string;
  comments?: string;
  url?: string;
  location?: string;
  temperature?: number;
  temperature_maximum?: number;
  temperature_minimum?: number;
  temperature_units?: string;
  temperature_at_negative_20cm?: number;
  temperature_at_negative_20cm_units?: string;
  relative_humidity?: number;
  precipitation_rate?: string;
  precipitation_type?: string;
  sky_cover?: string;
  height_of_snow?: number;
  height_of_snow_units?: string;
  height_of_new_snow_12_hours?: number;
  height_of_new_snow_24_hours?: number;
  height_of_new_snow_units?: string;
  height_of_new_snow_water_equivalent_12_hours?: number;
  height_of_new_snow_water_equivalent_24_hours?: number;
  height_of_new_snow_water_equivalent_units?: string;
  windspeed_ridgeline?: number | string;
  wind_direction_ridgeline?: string;
  windspeed?: number;
  wind_direction?: string;
  windspeed_units?: string;
  maximum_gust_speed?: number | string;
  maximum_gust_direction?: string;
  maximum_gust_duration_seconds?: string | number;
  blowing_snow?: string;
  windloading?: string;
  weather_detail?: WeatherDetail;
}

export interface Creator {
  id: string;
  type: string;
}

export interface FieldReport {
  id: string;
  type: string;
  backcountry_zone_id?: string;
  backcountry_zone?: BackcountryZone;
  url?: string;
  creator?: Creator;
  avalanche_observations_count?: number;
  avalanche_observations?: AvalancheObservation[];
  avalanche_detail?: AvalancheDetail;
  weather_observations_count?: number;
  weather_observations?: WeatherObservation[];
  weather_detail?: WeatherDetail;
  snowpack_observations_count?: number;
  snowpack_observations?: SnowpackObservation[];
  assets_count?: number;
  assets?: ObservationAsset[];
  highway_zone_id?: string;
  observed_at?: string;
  snowpack_detail?: SnowpackDetail;
  observation_form?: string;
  is_anonymous?: boolean;
  firstname?: string;
  lastname?: string;
  full_name?: string;
  organization?: string;
  status?: string;
  date_known?: string;
  time_known?: string;
  hw_op_bc?: string;
  area?: string;
  route?: string;
  is_locked?: boolean;
  objective?: string;
  saw_avalanche?: boolean;
  triggered_avalanche?: boolean;
  caught_in_avalanche?: boolean;
  state?: string;
  landmark?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_anonymous_location?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface ForecastSummaryDay {
  date?: string;
  content?: string;
}

export interface ForecastSummary {
  days: ForecastSummaryDay[];
}

export interface ExpectedSize {
  min: string;
  max: string;
}

export interface AvalancheProblem {
  type: string;
  aspectElevations: string[];
  likelihood: string;
  expectedSize: ExpectedSize;
  comment: string;
}

export interface AvalancheProblems {
  days: AvalancheProblem[][];
}

export interface ForecastConfidence {
  date: string;
  rating: string;
  statements: string[];
}

export interface ForecastConfidences {
  days: ForecastConfidence[];
}

export interface ForecastComms {
  headline: string;
  sms: string;
}

export interface DangerRating {
  position: number;
  alp: string;
  tln: string;
  btl: string;
  date: string;
}

export interface DangerRatings {
  days: DangerRating[];
}

export interface ForecastImage {
  id: string;
  url: string;
  width: number;
  height: number;
  credit: string;
  caption: string;
  tag: string;
}

export interface ForecastMedia {
  Images: ForecastImage[];
}

export interface AvalancheForecast {
  id: string;
  title?: string;  // Optional - often undefined in CAIC API responses
  publicName?: string;  // Zone numbers like "71-72-73-84-85-86-87-88-95"
  type: "avalancheforecast";
  polygons: any[];
  areaId: string;
  forecaster: string;
  issueDateTime: string;
  expiryDateTime: string;
  weatherSummary: ForecastSummary;
  snowpackSummary: ForecastSummary;
  avalancheSummary: ForecastSummary;
  avalancheProblems: AvalancheProblems;
  terrainAndTravelAdvice: any;
  confidence: ForecastConfidences;
  communication: ForecastComms;
  dangerRatings: DangerRatings;
  media: ForecastMedia;
}

export interface RegionalDiscussionForecast {
  id: string;
  title: string;
  type: string;
  polygons: string[];
  areaId: string;
  forecaster: string;
  issueDateTime: string;
  expiryDateTime: string;
  message: string;
  communications: ForecastComms;
  media: ForecastMedia;
}

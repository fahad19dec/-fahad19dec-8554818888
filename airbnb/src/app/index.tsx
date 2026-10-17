import { Redirect } from "expo-router";

// The anchor route: guests start on Home.
export default function Index() {
  return <Redirect href="/home" />;
}

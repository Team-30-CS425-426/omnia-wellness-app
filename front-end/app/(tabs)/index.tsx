import { Text, View } from "react-native";


function HomePage() {
    return (
        <View>
            <Text>Omnia</Text>
            <Text>Wellness Dashboards</Text>
            <Text>Key Stats</Text>
        </View>
    );
}

export default function Index() {
  return (
    <View
      // style={{
      //   flex: 1,
      //   justifyContent: "center",
      //   alignItems: "center",
      // }}
    >
      <HomePage/>
    </View>
  );
}



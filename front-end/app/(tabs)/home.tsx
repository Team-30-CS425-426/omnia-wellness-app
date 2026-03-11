import { WellnessDashboards } from "../components/home/dashboard";
import Title from "../components/home/title";
//import { supabase } from "@/config/homeSupabaseConfig";
import { View, ScrollView } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView
      style={{
        flex: 1,
        paddingHorizontal: "5%",
        paddingTop: "15%",
        backgroundColor: "white",
      }}
    >

      <View
        style={{
          alignItems: "center",
          paddingVertical: 20,
        }}
      >
        <Title
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </View>

      <WellnessDashboards
        style={{
          flex: 9,
          gap: 20,
          marginBottom: "30%",
        }}
      />
    </ScrollView>
  );
}

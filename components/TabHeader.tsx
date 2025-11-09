import { LinearGradient } from "expo-linear-gradient"
import { StyleSheet, Text, View } from "react-native"

export const TabHeader = ({ title , subtitle }: { title: string, subtitle: string }) => {
    return (
        <>
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#9A1B2B', '#6B1420']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerTitle}>{title}</Text>
                            <Text style={styles.headerSubtitle}>{subtitle}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </>
    )
}


const styles = StyleSheet.create({
    headerContainer: {
        overflow: 'hidden',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
})
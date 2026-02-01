import React, { useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Card, CardBorder, Text, Button, Avatar } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useCryptoData } from "../hooks/useCryptoData";

export function CryptoConverter() {
  const { assets } = useCryptoData({ limit: 10, useMock: true });
  const [amount, setAmount] = useState("1");
  const [fromCrypto, setFromCrypto] = useState("BTC");
  const [toCrypto, setToCrypto] = useState("ETH");

  const fromAsset = assets.find(a => a.symbol === fromCrypto);
  const toAsset = assets.find(a => a.symbol === toCrypto);

  const convertedAmount = fromAsset && toAsset
    ? (parseFloat(amount || "0") * fromAsset.price) / toAsset.price
    : 0;

  const usdValue = fromAsset
    ? parseFloat(amount || "0") * fromAsset.price
    : 0;

  return (
    <Card style={styles.container} border={CardBorder.Gradient}>
      <Text size={Size.Medium} weight="semibold" style={styles.title}>
        Crypto Converter
      </Text>

      <View style={styles.converterRow}>
        <View style={styles.inputGroup}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            From
          </Text>
          <View style={styles.inputRow}>
            <Avatar initials={fromCrypto.slice(0, 2)} size={Size.Small} />
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <Text size={Size.Small} weight="semibold" style={styles.symbol}>
              {fromCrypto}
            </Text>
          </View>
        </View>

        <View style={styles.swapButton}>
          <Button size={Size.Small} variant="ghost" onPress={() => {
            setFromCrypto(toCrypto);
            setToCrypto(fromCrypto);
          }}>
            ⇄
          </Button>
        </View>

        <View style={styles.inputGroup}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            To
          </Text>
          <View style={styles.inputRow}>
            <Avatar initials={toCrypto.slice(0, 2)} size={Size.Small} />
            <Text size={Size.Medium} weight="medium" style={styles.result}>
              {convertedAmount.toFixed(6)}
            </Text>
            <Text size={Size.Small} weight="semibold" style={styles.symbol}>
              {toCrypto}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.usdValue}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          ≈ ${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </Text>
      </View>

      <View style={styles.quickSelect}>
        {["BTC", "ETH", "SOL", "XRP"].map((sym) => (
          <Button
            key={sym}
            size={Size.Small}
            variant={fromCrypto === sym ? "primary" : "ghost"}
            onPress={() => setFromCrypto(sym)}
          >
            {sym}
          </Button>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  converterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  inputGroup: {
    flex: 1,
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: Colors.text.primary,
    fontFamily: "Inter, sans-serif",
    outlineStyle: "none",
  } as any,
  result: {
    flex: 1,
    fontFamily: "Inter, sans-serif",
  },
  symbol: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  swapButton: {
    paddingTop: 24,
  },
  usdValue: {
    marginTop: 12,
    alignItems: "center",
  },
  quickSelect: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    justifyContent: "center",
  },
});

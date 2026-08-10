import 'package:flutter_test/flutter_test.dart';
import 'package:flavorfind/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FlavorFindApp());
  });
}

from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .ahp import DEFAULT_CR_THRESHOLD, run_adaptive_ahp

from .models import LayerUpload, NewsItem, Service, TeamMember
from .serializers import (
    AHPComputeSerializer,
    LayerUploadSerializer,
    NewsItemSerializer,
    ServiceSerializer,
    TeamMemberSerializer,
)


class NewsItemViewSet(viewsets.ModelViewSet):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class LayerUploadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LayerUpload.objects.all()
    serializer_class = LayerUploadSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


MAX_RESPONSE_RESULTS = 150


class AHPComputeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):  # type: ignore[override]
        serializer = AHPComputeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        criteria_names = serializer.validated_data["criteria_names"]
        bounds = serializer.build_bounds()

        valid_results, all_results, duration = run_adaptive_ahp(
            bounds,
            len(criteria_names),
        )

        results_to_display = valid_results
        if all_results:
            desired_count = min(
                MAX_RESPONSE_RESULTS,
                max(len(valid_results), min(25, len(all_results))),
            )

            if len(results_to_display) < desired_count:
                sorted_results = sorted(all_results, key=lambda result: result.consistency_ratio)
                combined_results = valid_results + sorted_results
                seen: set[bytes] = set()
                results_to_display = []

                for result in combined_results:
                    signature = result.matrix.tobytes()
                    if signature in seen:
                        continue
                    seen.add(signature)
                    results_to_display.append(result)
                    if len(results_to_display) >= desired_count:
                        break

        results_to_display = results_to_display[:MAX_RESPONSE_RESULTS]

        formatted_results = [
            {
                "matrix": result.matrix.round(4).tolist(),
                "weights": result.weights.round(4).tolist(),
                "cr": float(round(result.consistency_ratio, 4)),
            }
            for result in results_to_display
        ]

        if formatted_results:
            average_cr = sum(entry["cr"] for entry in formatted_results) / len(formatted_results)
            weights_array = [entry["weights"] for entry in formatted_results]
            average_weights = (
                [
                    float(round(sum(values) / len(weights_array), 4))
                    for values in zip(*weights_array)
                ]
                if weights_array
                else []
            )
        else:
            average_cr = 0.0
            average_weights: list[float] = []

        response_data = {
            "criteria_names": criteria_names,
            "duration": round(duration, 3),
            "average_cr": float(round(average_cr, 4)),
            "average_weights": average_weights,
            "valid_results": formatted_results,
            "total_samples": len(all_results),
            "valid_samples": len(valid_results),
            "cr_threshold": DEFAULT_CR_THRESHOLD,
        }

        return Response(response_data, status=status.HTTP_200_OK)
